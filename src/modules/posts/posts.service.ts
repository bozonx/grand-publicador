import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChannelsService } from '../channels/channels.service.js';
import { PermissionsService } from '../../common/services/permissions.service.js';
import { PostType, PostStatus, ProjectRole } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private channelsService: ChannelsService,
    private permissions: PermissionsService,
  ) {}

  /**
   * Create a new post in a specific channel.
   * Requires OWNER, ADMIN, or EDITOR role in the channel's project.
   *
   * @param userId - The ID of the user creating the post.
   * @param channelId - The ID of the target channel.
   * @param data - The post creation data.
   * @returns The created post.
   */
  async create(
    userId: string,
    channelId: string,
    data: {
      content: string;
      socialMedia: string;
      postType: PostType;
      title?: string;
      description?: string;
      authorComment?: string;
      tags?: string;
      mediaFiles?: any;
      scheduledAt?: Date;
      status?: PostStatus;
    },
  ) {
    const channel = await this.channelsService.findOne(channelId, userId);
    await this.permissions.checkProjectPermission(channel.projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.EDITOR,
    ]);

    return this.prisma.post.create({
      data: {
        channelId,
        authorId: userId,
        content: data.content,
        socialMedia: data.socialMedia,
        postType: data.postType,
        title: data.title,
        description: data.description,
        authorComment: data.authorComment,
        tags: data.tags,
        mediaFiles: JSON.stringify(data.mediaFiles || []),
        scheduledAt: data.scheduledAt,
        status: data.status || PostStatus.DRAFT,
      },
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
  async findAllForChannel(channelId: string, userId: string) {
    await this.channelsService.findOne(channelId, userId); // Validates access
    return this.prisma.post.findMany({
      where: { channelId },
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
  async findOne(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
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
  async update(
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
    if (post.authorId !== userId) {
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
  async remove(id: string, userId: string) {
    const post = await this.findOne(id, userId);

    // Permission: Only author or admin/owner of the project can delete
    if (post.authorId !== userId) {
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
