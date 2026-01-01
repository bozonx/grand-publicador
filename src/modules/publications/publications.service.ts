import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PostStatus, PostType, Prisma, ProjectRole } from '@prisma/client';

import { PermissionsService } from '../../common/services/permissions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePublicationDto, UpdatePublicationDto } from './dto/index.js';

@Injectable()
export class PublicationsService {
  private readonly logger = new Logger(PublicationsService.name);

  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsService,
  ) {}

  /**
   * Create a new publication.
   * If userId is provided, it checks if the user has access to the project.
   * If userId is not provided, it assumes a system call or external integration (skipped permission check).
   *
   * @param data - The publication creation data.
   * @param userId - Optional ID of the user creating the publication.
   * @returns The created publication.
   */
  public async create(data: CreatePublicationDto, userId?: string) {
    if (userId) {
      // Check if user has access to the project
      await this.permissions.checkProjectAccess(data.projectId, userId);
    }

    const publication = await this.prisma.publication.create({
      data: {
        projectId: data.projectId,
        authorId: userId ?? null,
        title: data.title,
        content: data.content,
        mediaFiles: JSON.stringify(data.mediaFiles ?? []),
        tags: data.tags,
        status: data.status ?? PostStatus.DRAFT,
        meta: JSON.stringify(data.meta ?? {}),
      },
    });

    const author = userId ? `user ${userId}` : 'external system';
    this.logger.log(
      `Publication "${publication.title ?? publication.id}" created in project ${data.projectId} by ${author}`,
    );

    return publication;
  }

  /**
   * Retrieve all publications for a project, optionally filtered.
   * Validates that the user has access to the project.
   *
   * @param projectId - The ID of the project.
   * @param userId - The ID of the user.
   * @param filters - Optional filters (status, limit, offset).
   * @returns A list of publications with associated data (author, posts).
   */
  public async findAll(
    projectId: string,
    userId: string,
    filters?: {
      status?: PostStatus;
      limit?: number;
      offset?: number;
    },
  ) {
    await this.permissions.checkProjectAccess(projectId, userId);

    const where: Prisma.PublicationWhereInput = {
      projectId,
      archivedAt: null,
      project: { archivedAt: null },
    };
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.publication.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            telegramUsername: true,
            avatarUrl: true,
          },
        },
        posts: {
          include: {
            channel: true,
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });
  }

  /**
   * Find a single publication by ID.
   * Ensures the user has access to the project containing the publication.
   *
   * @param id - The ID of the publication.
   * @param userId - The ID of the user.
   * @returns The publication details.
   * @throws NotFoundException if the publication does not exist.
   */
  public async findOne(id: string, userId: string) {
    const publication = await this.prisma.publication.findUnique({
      where: {
        id,
        archivedAt: null,
        project: { archivedAt: null },
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            telegramUsername: true,
            avatarUrl: true,
          },
        },
        project: true,
        posts: {
          include: {
            channel: true,
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    await this.permissions.checkProjectAccess(publication.projectId, userId);

    return publication;
  }

  /**
   * Update an existing publication.
   * Allowed for the author or project OWNER/ADMIN.
   *
   * @param id - The ID of the publication.
   * @param userId - The ID of the user.
   * @param data - The data to update.
   */
  public async update(id: string, userId: string, data: UpdatePublicationDto) {
    const publication = await this.findOne(id, userId);

    // Check if user is author or has admin rights
    if (publication.authorId !== userId) {
      await this.permissions.checkProjectPermission(publication.projectId, userId, [
        ProjectRole.OWNER,
        ProjectRole.ADMIN,
      ]);
    }

    return this.prisma.publication.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        mediaFiles: data.mediaFiles ? JSON.stringify(data.mediaFiles) : undefined,
        tags: data.tags,
        status: data.status,
        meta: data.meta ? JSON.stringify(data.meta) : undefined,
      },
    });
  }

  /**
   * Delete a publication.
   * Allowed for the author or project OWNER/ADMIN.
   *
   * @param id - The ID of the publication to remove.
   * @param userId - The ID of the user.
   */
  public async remove(id: string, userId: string) {
    const publication = await this.findOne(id, userId);

    // Check if user is author or has admin rights
    if (publication.authorId !== userId) {
      await this.permissions.checkProjectPermission(publication.projectId, userId, [
        ProjectRole.OWNER,
        ProjectRole.ADMIN,
      ]);
    }

    return this.prisma.publication.delete({
      where: { id },
    });
  }

  /**
   * Generate individual posts for specified channels from a publication.
   * Verifies that all channels belong to the same project as the publication.
   *
   * @param publicationId - The ID of the source publication.
   * @param channelIds - List of channel IDs to create posts for.
   * @param userId - Optional user ID (if authenticated request).
   * @param scheduledAt - Optional schedule time for the posts.
   * @returns The created posts.
   */
  public async createPostsFromPublication(
    publicationId: string,
    channelIds: string[],
    userId?: string,
    scheduledAt?: Date,
  ) {
    // Validate channelIds is not empty
    if (!channelIds || channelIds.length === 0) {
      throw new BadRequestException('At least one channel must be specified');
    }

    // Fetch publication without auth check initially, but check later if userId present
    // Or if userId is needed for finding it...

    let publication;

    if (userId) {
      publication = await this.findOne(publicationId, userId);
    } else {
      // System/External fetch
      publication = await this.prisma.publication.findUnique({
        where: { id: publicationId },
      });
      if (!publication) {
        throw new NotFoundException('Publication not found');
      }
    }

    // Verify all channels belong to the same project
    const channels = await this.prisma.channel.findMany({
      where: {
        id: { in: channelIds },
        projectId: publication.projectId,
      },
    });

    if (channels.length !== channelIds.length) {
      throw new NotFoundException('Some channels not found or do not belong to this project');
    }

    // Create posts for each channel
    const posts = await Promise.all(
      channels.map(channel =>
        this.prisma.post.create({
          data: {
            publicationId: publication.id,
            channelId: channel.id,
            authorId: userId ?? null,
            content: publication.content,
            socialMedia: channel.socialMedia,
            postType: PostType.POST,
            title: publication.title,
            tags: publication.tags,
            mediaFiles: publication.mediaFiles,
            status: scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT,
            scheduledAt,
            meta: publication.meta,
          },
        }),
      ),
    );

    return posts;
  }
}
