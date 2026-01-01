import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';

import { PermissionsService } from '../../common/services/permissions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import type { CreateChannelDto, UpdateChannelDto } from './dto/index.js';

@Injectable()
export class ChannelsService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
    private permissions: PermissionsService,
  ) { }

  /**
   * Creates a new channel within a project.
   * Requires OWNER, ADMIN, or EDITOR role in the project.
   *
   * @param userId - The ID of the user creating the channel.
   * @param projectId - The ID of the project.
   * @param data - The channel creation data.
   * @returns The created channel.
   */
  public async create(
    userId: string,
    projectId: string,
    data: Omit<CreateChannelDto, 'projectId'>,
  ) {
    await this.permissions.checkProjectPermission(projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.EDITOR,
    ]);

    return this.prisma.channel.create({
      data: {
        projectId,
        socialMedia: data.socialMedia,
        name: data.name,
        channelIdentifier: data.channelIdentifier,
        credentials: JSON.stringify(data.credentials ?? {}),
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Retrieves all channels for a given project.
   * Implicitly validates that the user is a member of the project.
   *
   * @param projectId - The ID of the project.
   * @param userId - The ID of the user requesting the channels.
   * @returns A list of channels with post counts.
   */
  public async findAllForProject(projectId: string, userId: string, allowArchived = false) {
    await this.projectsService.findOne(projectId, userId, true); // Validates membership, allow archived project
    const channels = await this.prisma.channel.findMany({
      where: {
        projectId,
        ...(allowArchived ? {} : { archivedAt: null }),
        project: { archivedAt: null },
      },
      include: {
        _count: {
          select: { posts: true },
        },
        posts: {
          where: { archivedAt: null },
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return channels.map(channel => {
      const { posts, _count, ...channelData } = channel;
      return {
        ...channelData,
        postsCount: _count.posts,
        lastPostAt: posts[0]?.createdAt || null,
      };
    });
  }

  /**
   * Find a single channel by ID.
   * Ensures the user has access to the project containing the channel.
   *
   * @param id - The ID of the channel.
   * @param userId - The ID of the user.
   * @param allowArchived - Whether to allow finding archived channels.
   * @returns The channel details.
   * @throws NotFoundException if the channel does not exist.
   */
  public async findOne(id: string, userId: string, allowArchived = false) {
    const channel = await this.prisma.channel.findUnique({
      where: {
        id,
        ...(allowArchived ? {} : { archivedAt: null }),
        project: { archivedAt: null },
      },
      include: {
        _count: {
          select: { posts: true },
        },
        posts: {
          where: { archivedAt: null },
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await this.projectsService.findOne(channel.projectId, userId);

    const { posts, _count, ...channelData } = channel;
    return {
      ...channelData,
      postsCount: _count.posts,
      lastPostAt: posts[0]?.createdAt || null,
    };
  }

  /**
   * Update an existing channel.
   * Requires OWNER, ADMIN, or EDITOR role.
   *
   * @param id - The ID of the channel.
   * @param userId - The ID of the user.
   * @param data - The data to update.
   */
  public async update(id: string, userId: string, data: UpdateChannelDto) {
    const channel = await this.findOne(id, userId);
    await this.permissions.checkProjectPermission(channel.projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.EDITOR,
    ]);

    return this.prisma.channel.update({
      where: { id },
      data: {
        name: data.name,
        channelIdentifier: data.channelIdentifier,
        credentials: data.credentials ? JSON.stringify(data.credentials) : undefined,
        isActive: data.isActive,
      },
    });
  }

  /**
   * Remove a channel.
   * Requires OWNER or ADMIN role.
   *
   * @param id - The ID of the channel to remove.
   * @param userId - The ID of the user.
   */
  public async remove(id: string, userId: string) {
    const channel = await this.findOne(id, userId);
    await this.permissions.checkProjectPermission(channel.projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    return this.prisma.channel.delete({
      where: { id },
    });
  }

  /**
   * Archive a channel.
   * Requires OWNER, ADMIN, or EDITOR role.
   *
   * @param id - The ID of the channel.
   * @param userId - The ID of the user.
   */
  public async archive(id: string, userId: string) {
    const channel = await this.findOne(id, userId);
    await this.permissions.checkProjectPermission(channel.projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.EDITOR,
    ]);

    return this.prisma.channel.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedBy: userId,
      },
    });
  }

  /**
   * Unarchive a channel.
   * Requires OWNER, ADMIN, or EDITOR role.
   *
   * @param id - The ID of the channel.
   * @param userId - The ID of the user.
   */
  public async unarchive(id: string, userId: string) {
    const channel = await this.findOne(id, userId, true);
    await this.permissions.checkProjectPermission(channel.projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.EDITOR,
    ]);

    return this.prisma.channel.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedBy: null,
      },
    });
  }
}
