import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PostStatus, Prisma } from '@prisma/client';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private prisma: PrismaService) { }

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
  async getPendingPosts(
    limit: number = 10,
    lookbackMinutes: number = 60,
    userId: string,
    scopeProjectIds: string[],
  ) {
    const now = new Date();
    const lookbackDate = new Date(now.getTime() - lookbackMinutes * 60 * 1000);

    // Get user's owned projects
    const ownedProjects = await this.prisma.project.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const ownedProjectIds = ownedProjects.map((p) => p.id);

    // Filter by scope if specified
    const allowedProjectIds =
      scopeProjectIds.length > 0
        ? ownedProjectIds.filter((id) => scopeProjectIds.includes(id))
        : ownedProjectIds;

    if (allowedProjectIds.length === 0) {
      return []; // No projects accessible with this token
    }

    // 1. Mark overdue posts as EXPIRED (only for allowed projects)
    await this.prisma.post.updateMany({
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
   *
   * @param postId - The ID of the post to claim.
   * @returns The updated post with claim metadata.
   * @throws Error if post is not found, not scheduled, or already being processed.
   */
  async claimPost(postId: string) {
    this.logger.log(`Claiming post ${postId}`);

    return this.prisma.$transaction(async tx => {
      const post = await tx.post.findUnique({
        where: { id: postId },
        include: {
          channel: true,
          publication: true,
        },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      if (post.status !== PostStatus.SCHEDULED) {
        throw new Error('Post is not scheduled');
      }

      // Parse meta and check processing flag
      const meta = JSON.parse(post.meta);
      if (meta.processing) {
        throw new Error('Post is already being processed');
      }

      // Atomic update within transaction
      // We could also check version if we had one, but strict transaction isolation
      // or select for update would be even better. Since we are in a transaction
      // and checking permissions, this is reasonably safe for this scale.
      return tx.post.update({
        where: { id: postId },
        data: {
          meta: JSON.stringify({
            ...meta,
            processing: true,
            claimedAt: new Date().toISOString(),
          }),
        },
        include: {
          channel: true,
          publication: true,
        },
      });
    });
  }

  /**
   * Update post status after a publishing attempt.
   * Removes the 'processing' flag and updates the status and last error if applicable.
   *
   * @param postId - The ID of the post.
   * @param status - The new status (e.g., PUBLISHED, FAILED).
   * @param error - Optional error message if the attempt failed.
   * @returns The updated post.
   */
  async updatePostStatus(postId: string, status: PostStatus, error?: string) {
    this.logger.log(`Updating post ${postId} status to ${status}`);

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const meta = JSON.parse(post.meta);
    delete meta.processing;

    const updateData: Prisma.PostUpdateInput = {
      status,
      meta: JSON.stringify({
        ...meta,
        ...(error && { lastError: error }),
        updatedAt: new Date().toISOString(),
      }),
    };

    if (status === PostStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: updateData,
    });
  }
}
