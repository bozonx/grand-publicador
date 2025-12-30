import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus, Prisma } from '@prisma/client';

import { TRANSACTION_TIMEOUT } from '../../common/constants/database.constants.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private prisma: PrismaService) { }

  /**
   * Safely parse JSON with error handling
   */
  private parsePostMeta(metaString: string, postId: string): any {
    try {
      return JSON.parse(metaString);
    } catch (error) {
      this.logger.error(`Failed to parse post meta for post ${postId}`, error);
      return {};
    }
  }

  /**
   * Get posts that are ready to be published.
   * Criteria: Status is SCHEDULED and scheduledAt is in the past (up to a lookback window).
   * Also marks posts older than the lookback window as EXPIRED.
   * Filters by user's owned projects and token scope.
   *
   * @param limit - Maximum number of posts to retrieve.
   * @param lookbackMinutes - Window in minutes to check for pending posts.
   * @param userId - The ID of the user making the request.
   * @param scopeProjectIds - Array of project IDs in the token's scope (empty = all projects).
   * @returns A list of pending posts with related data.
   */
  public async getPendingPosts(
    limit: number = 10,
    lookbackMinutes: number = 60,
    userId: string,
    scopeProjectIds: string[],
  ) {
    const now = new Date();
    const lookbackDate = new Date(now.getTime() - lookbackMinutes * 60 * 1000);

    // Get projects where user is a member
    const userProjects = await this.prisma.projectMember.findMany({
      where: { userId: userId },
      select: { projectId: true },
    });

    const userProjectIds = userProjects.map(p => p.projectId);

    // Filter by scope if specified
    const allowedProjectIds =
      scopeProjectIds.length > 0
        ? userProjectIds.filter(id => scopeProjectIds.includes(id))
        : userProjectIds;

    if (allowedProjectIds.length === 0) {
      return []; // No projects accessible with this token
    }

    // 1. Mark overdue posts as EXPIRED (only for allowed projects)
    const expiredCount = await this.prisma.post.updateMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: {
          lt: lookbackDate,
        },
        channel: {
          projectId: {
            in: allowedProjectIds,
          },
        },
      },
      data: {
        status: PostStatus.EXPIRED,
        meta: JSON.stringify({
          expiredAt: now.toISOString(),
          reason: 'Post too old to publish',
        }),
      },
    });

    if (expiredCount.count > 0) {
      this.logger.log(
        `Marked ${expiredCount.count} posts as EXPIRED (older than ${lookbackMinutes} minutes)`,
      );
    }

    // 2. Get pending posts within the window (only for allowed projects)
    return this.prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: {
          lte: now,
          gte: lookbackDate,
        },
        channel: {
          projectId: {
            in: allowedProjectIds,
          },
        },
      },
      include: {
        channel: true,
        publication: true,
        author: {
          select: {
            id: true,
            fullName: true,
            telegramUsername: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Claim a post for publishing.
   * Atomic operation that sets a 'processing' flag in the meta field to prevent race conditions.
   * Verifies that the user has access to the project the post belongs to.
   *
   * @param postId - The ID of the post to claim.
   * @param userId - The ID of the user claiming the post.
   * @param scopeProjectIds - Allowed project IDs from the token.
   * @returns The updated post with claim metadata.
   * @throws NotFoundException if post is not found.
   * @throws ForbiddenException if access denied.
   * @throws BadRequestException if post is not scheduled.
   * @throws ConflictException if post is already processed.
   */
  public async claimPost(postId: string, userId: string, scopeProjectIds: string[]) {
    this.logger.log(`Claiming post ${postId} by user ${userId}`);

    return this.prisma.$transaction(
      async tx => {
        const post = await tx.post.findUnique({
          where: { id: postId },
          include: {
            channel: true,
            publication: true,
          },
        });

        if (!post) {
          throw new NotFoundException('Post not found');
        }

        // Security Check: explicit project scope validation
        const projectId = post.channel.projectId;

        // 1. Check Token Scope
        if (scopeProjectIds.length > 0 && !scopeProjectIds.includes(projectId)) {
          throw new ForbiddenException('Access denied: Project not in token scope');
        }

        // 2. Check User Membership (ensure user actually has access to this project)
        const member = await tx.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId,
            },
          },
        });

        if (!member) {
          throw new ForbiddenException('Access denied: User is not a member of this project');
        }

        if (post.status !== PostStatus.SCHEDULED) {
          throw new BadRequestException('Post is not scheduled');
        }

        // Parse meta and check processing flag
        const meta = this.parsePostMeta(post.meta, postId);
        if (meta.processing) {
          throw new ConflictException('Post is already being processed');
        }

        // Update post with processing flag
        const updatedPost = await tx.post.update({
          where: { id: postId },
          data: {
            meta: JSON.stringify({
              ...meta,
              processing: true,
              claimedBy: userId,
              claimedAt: new Date().toISOString(),
            }),
          },
          include: {
            channel: true,
            publication: true,
          },
        });

        this.logger.log(`Post ${postId} successfully claimed by user ${userId}`);

        return updatedPost;
      },
      {
        maxWait: TRANSACTION_TIMEOUT.MAX_WAIT,
        timeout: TRANSACTION_TIMEOUT.TIMEOUT,
      },
    );
  }

  /**
   * Update post status after a publishing attempt.
   * Removes the 'processing' flag and updates the status and last error if applicable.
   * Verifies access.
   *
   * @param postId - The ID of the post.
   * @param status - The new status (e.g., PUBLISHED, FAILED).
   * @param userId - The ID of the user updating the status.
   * @param scopeProjectIds - Allowed project IDs from the token.
   * @param error - Optional error message if the attempt failed.
   * @returns The updated post.
   */
  public async updatePostStatus(
    postId: string,
    status: PostStatus,
    userId: string,
    scopeProjectIds: string[],
    error?: string,
  ) {
    this.logger.log(`Updating post ${postId} status to ${status} by user ${userId}`);

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        channel: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Security Check
    const projectId = post.channel.projectId;

    // 1. Check Token Scope
    if (scopeProjectIds.length > 0 && !scopeProjectIds.includes(projectId)) {
      throw new ForbiddenException('Access denied: Project not in token scope');
    }

    // 2. Check User Membership
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Access denied: User is not a member of this project');
    }

    const meta = this.parsePostMeta(post.meta, postId);
    delete meta.processing;

    const updateData: Prisma.PostUpdateInput = {
      status,
      meta: JSON.stringify({
        ...meta,
        ...(error && { lastError: error }),
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      }),
    };

    if (status === PostStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: updateData,
    });

    this.logger.log(`Post ${postId} status updated to ${status} by user ${userId}`);

    return updatedPost;
  }
}
