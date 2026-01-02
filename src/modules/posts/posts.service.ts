import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus, PostType, ProjectRole } from '@prisma/client';

import { PermissionsService } from '../../common/services/permissions.service.js';
import { ChannelsService } from '../channels/channels.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private channelsService: ChannelsService,
    private permissions: PermissionsService,
  ) { }

  /**
   * Create a new post in a specific channel.
   * Requires OWNER, ADMIN, or EDITOR role in the channel's project.
   *
   * @param userId - The ID of the user creating the post.
   * @param channelId - The ID of the target channel.
   * @param data - The post creation data.
   * @returns The created post.
   */
  public async create(
    userId: string,
    channelId: string,
    data: {
      content: string;
      socialMedia?: string;
      postType: PostType;
      title?: string;
      description?: string;
      authorComment?: string;
      tags?: string;
      mediaFiles?: any;
      postDate?: Date;
      scheduledAt?: Date;
      status?: PostStatus;
      language?: string;
      publicationId?: string;
    },
  ) {
    const channel = await this.channelsService.findOne(channelId, userId);
    await this.permissions.checkProjectPermission(channel.projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.EDITOR,
    ]);

    let publicationId = data.publicationId;

    // If no publicationId is provided, create a wrapper publication
    if (!publicationId) {
      const publication = await this.prisma.publication.create({
        data: {
          projectId: channel.projectId,
          createdBy: userId,
          title: data.title || 'Standalone Post',
          description: data.description,
          content: data.content,
          authorComment: data.authorComment,
          status: data.status || PostStatus.DRAFT,
          postType: data.postType,
          postDate: data.postDate,
          language: data.language || channel.language,
          meta: JSON.stringify({ isStandalone: true }),
        },
      });
      publicationId = publication.id;
    }

    return this.prisma.post.create({
      data: {
        channelId,
        publicationId,
        createdBy: userId,
        content: data.content,
        socialMedia: data.socialMedia ?? channel.socialMedia,
        postType: data.postType,
        title: data.title,
        description: data.description,
        authorComment: data.authorComment,
        tags: data.tags,
        mediaFiles: JSON.stringify(data.mediaFiles ?? []),
        postDate: data.postDate,
        scheduledAt: data.scheduledAt,
        status: data.status ?? PostStatus.DRAFT,
        language: data.language ?? channel.language,
      },
    });
  }

  /**
   * Retrieve all posts for a specific project.
   * Validates that the user has access to the project.
   *
   * @param projectId - The ID of the project.
   * @param userId - The ID of the user.
   * @returns A list of posts for all channels in the project.
   */
  public async findAllForProject(
    projectId: string,
    userId: string,
    filters?: { status?: PostStatus; postType?: PostType; search?: string; includeArchived?: boolean },
  ) {
    // Check project permission (owner/admin/editor/viewer)
    const role = await this.permissions.getUserProjectRole(projectId, userId);
    if (!role) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const where: any = {
      ...(filters?.includeArchived ? {} : { archivedAt: null }),
      channel: {
        projectId,
        ...(filters?.includeArchived ? {} : { archivedAt: null }),
        project: { archivedAt: null },
      },
    };

    if (filters?.status && typeof filters.status === 'string') {
      where.status = filters.status.toUpperCase() as PostStatus;
    }
    if (filters?.postType && typeof filters.postType === 'string') {
      where.postType = filters.postType.toUpperCase() as PostType;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.post.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            projectId: true,
            socialMedia: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            telegramUsername: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieve all posts for a given user across all projects they are members of.
   *
   * @param userId - The ID of the user requesting the posts.
   * @param filters - Optional filters (status, search, includeArchived).
   * @returns A list of posts with channel and author info.
   */
  public async findAllForUser(
    userId: string,
    filters?: { status?: PostStatus; postType?: PostType; search?: string; includeArchived?: boolean },
  ) {
    const where: any = {
      channel: {
        project: {
          members: {
            some: { userId },
          },
          archivedAt: null,
        },
        ...(filters?.includeArchived ? {} : { archivedAt: null }),
      },
      ...(filters?.includeArchived ? {} : { archivedAt: null }),
    };

    if (filters?.status && typeof filters.status === 'string') {
      where.status = filters.status.toUpperCase() as PostStatus;
    }
    if (filters?.postType && typeof filters.postType === 'string') {
      where.postType = filters.postType.toUpperCase() as PostType;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.post.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            projectId: true,
            socialMedia: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            telegramUsername: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieve all posts for a specific channel.
   * Validates that the user has access to the channel.
   *
   * @param channelId - The ID of the channel.
   * @param userId - The ID of the user.
   * @returns A list of posts, ordered by creation date (descending).
   */
  public async findAllForChannel(
    channelId: string,
    userId: string,
    filters?: { status?: PostStatus; postType?: PostType; search?: string, includeArchived?: boolean },
  ) {
    await this.channelsService.findOne(channelId, userId); // Validates access

    const where: any = {
      channelId,
      ...(filters?.includeArchived ? {} : { archivedAt: null }),
      channel: {
        ...(filters?.includeArchived ? {} : { archivedAt: null }),
        project: { archivedAt: null },
      },
    };

    if (filters?.status && typeof filters.status === 'string') {
      where.status = filters.status.toUpperCase() as PostStatus;
    }
    if (filters?.postType && typeof filters.postType === 'string') {
      where.postType = filters.postType.toUpperCase() as PostType;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.post.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            projectId: true,
            socialMedia: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            telegramUsername: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a single post by ID.
   * Ensures the user has access to the channel containing the post.
   *
   * @param id - The ID of the post.
   * @param userId - The ID of the user.
   * @returns The post details.
   * @throws NotFoundException if the post does not exist.
   */
  public async findOne(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        id,
        archivedAt: null,
        channel: {
          archivedAt: null,
          project: { archivedAt: null },
        },
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            projectId: true,
            socialMedia: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            telegramUsername: true,
            avatarUrl: true,
          },
        },
        publication: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.channelsService.findOne(post.channelId, userId); // Validates access
    return post;
  }

  /**
   * Update an existing post.
   * Allowed for the post author or project OWNER/ADMIN.
   *
   * @param id - The ID of the post.
   * @param userId - The ID of the user.
   * @param data - The data to update.
   * @throws ForbiddenException if the user lacks permissions.
   */
  public async update(
    id: string,
    userId: string,
    data: {
      content?: string;
      title?: string;
      description?: string;
      authorComment?: string;
      tags?: string;
      mediaFiles?: any;
      status?: PostStatus;
      scheduledAt?: Date;
      publishedAt?: Date;
    },
  ) {
    const post = await this.findOne(id, userId);

    // Permission: Only author or admin/owner of the project can update
    if (post.createdBy !== userId) {
      const channel = await this.prisma.channel.findUnique({ where: { id: post.channelId } });
      if (channel) {
        await this.permissions.checkProjectPermission(channel.projectId, userId, [
          ProjectRole.OWNER,
          ProjectRole.ADMIN,
        ]);
      } else {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        content: data.content,
        title: data.title,
        description: data.description,
        authorComment: data.authorComment,
        tags: data.tags,
        status: data.status,
        scheduledAt: data.scheduledAt,
        publishedAt: data.publishedAt,
        mediaFiles: data.mediaFiles ? JSON.stringify(data.mediaFiles) : undefined,
      },
    });
  }

  /**
   * Remove a post.
   * Allowed for the post author or project OWNER/ADMIN.
   *
   * @param id - The ID of the post to remove.
   * @param userId - The ID of the user.
   */
  public async remove(id: string, userId: string) {
    const post = await this.findOne(id, userId);

    // Permission: Only author or admin/owner of the project can delete
    if (post.createdBy !== userId) {
      const channel = await this.prisma.channel.findUnique({ where: { id: post.channelId } });
      if (channel) {
        await this.permissions.checkProjectPermission(channel.projectId, userId, [
          ProjectRole.OWNER,
          ProjectRole.ADMIN,
        ]);
      } else {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return this.prisma.post.delete({
      where: { id },
    });
  }
}
