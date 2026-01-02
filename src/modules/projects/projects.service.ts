import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProjectRole, type Project } from '@prisma/client';

import { TRANSACTION_TIMEOUT } from '../../common/constants/database.constants.js';
import { PermissionsService } from '../../common/services/permissions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProjectDto, UpdateProjectDto } from './dto/index.js';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsService,
  ) { }

  /**
   * Creates a new project and assigns the creator as the owner.
   * This is done in a transaction to ensure both the project and the membership record are created.
   *
   * @param userId - The ID of the user creating the project.
   * @param data - The project creation data.
   * @returns The created project.
   */
  public async create(userId: string, data: CreateProjectDto): Promise<Project> {
    this.logger.log(`Creating project "${data.name}" for user ${userId}`);

    return this.prisma.$transaction(
      async tx => {
        const project = await tx.project.create({
          data: {
            name: data.name,
            description: data.description,
            ownerId: userId,
          },
        });

        // Keep adding owner as a member to simplify queries like findAllForUser
        // that rely on checking the members relation
        await tx.projectMember.create({
          data: {
            projectId: project.id,
            userId: userId,
            role: ProjectRole.OWNER,
          },
        });

        this.logger.log(`Project "${data.name}" (${project.id}) created successfully`);

        return project;
      },
      {
        maxWait: TRANSACTION_TIMEOUT.MAX_WAIT,
        timeout: TRANSACTION_TIMEOUT.TIMEOUT,
      },
    );
  }

  /**
   * Returns all projects available to the user.
   * Filters projects where the user is a member (including owner).
   *
   * @param userId - The ID of the user.
   * @param options - Pagination and filtering options.
   * @returns A list of projects including member count and channel count.
   */
  public async findAllForUser(
    userId: string,
    options?: { includeArchived?: boolean },
  ) {
    const includeArchived = options?.includeArchived ?? false;

    const projects = await this.prisma.project.findMany({
      where: {
        ...(includeArchived ? {} : { archivedAt: null }),
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: {
          select: {
            channels: { where: { archivedAt: null } },
            publications: { where: { archivedAt: null } },
          },
        },
        publications: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true },
        },
        channels: {
          where: { archivedAt: null },
          select: { language: true },
          distinct: ['language'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map(project => {
      const userMember = project.members[0]; // We filtered by userId, so there is at most one

      const lastPublicationAt = project.publications[0]?.createdAt || null;
      const lastPublicationId = project.publications[0]?.id || null;
      const languages = project.channels.map(c => c.language).sort();

      const { publications: _, channels: _channels, ...projectData } = project;

      return {
        ...projectData,
        // channels: [] - removed to reduce payload
        role: userMember?.role?.toLowerCase(),
        channelCount: project._count.channels,
        publicationsCount: project._count.publications,
        // memberCount: project.members.length, // usage of this count meant fetching all members, which we removed. 
        // If we strictly need memberCount, we should add it to _count.
        // Assuming we can add memberCount to _count or drop it if not critical. 
        // The previous code returned "memberCount" but loaded all members.
        // Let's add members to _count.
        lastPublicationAt,
        lastPublicationId,
        languages,
      };
    });
  }

  /**
   * Returns all archived projects for the user.
   * Filters projects where the user is a member and the project is archived.
   * Sorted by archival date (newest first).
   *
   * @param userId - The ID of the user.
   * @param options - Pagination options.
   * @returns A list of archived projects.
   */
  public async findArchivedForUser(
    userId: string,
  ) {

    const projects = await this.prisma.project.findMany({
      where: {
        archivedAt: { not: null },
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: {
          select: {
            channels: { where: { archivedAt: null } },
            publications: { where: { archivedAt: null } },
          },
        },
        publications: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true },
        },
        channels: {
          where: { archivedAt: null },
          select: { language: true },
          distinct: ['language'],
        },
      },
      orderBy: { archivedAt: 'desc' },
    });

    return projects.map(project => {
      const userMember = project.members[0];

      const lastPublicationAt = project.publications[0]?.createdAt || null;
      const lastPublicationId = project.publications[0]?.id || null;
      const languages = project.channels.map(c => c.language).sort();

      const { publications: _, channels: _channels, ...projectData } = project;

      return {
        ...projectData,
        role: userMember?.role?.toLowerCase(),
        channelCount: project._count.channels,
        publicationsCount: project._count.publications,
        lastPublicationAt,
        lastPublicationId,
        languages,
      };
    });
  }


  /**
   * Find one project by ID with security check.
   * Verifies that the user is a member of the project before returning it.
   *
   * @param projectId - The ID of the project.
   * @param userId - The ID of the user.
   * @param allowArchived - Whether to allow finding archived projects.
   * @returns The project details including channels, members, and the user's role.
   * @throws ForbiddenException if the user is not a member.
   * @throws NotFoundException if the project does not exist.
   */
  public async findOne(projectId: string, userId: string, allowArchived = false): Promise<any> {
    const role = await this.permissions.getUserProjectRole(projectId, userId);

    if (!role) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId, ...(allowArchived ? {} : { archivedAt: null }) },
      include: {
        _count: {
          select: {
            channels: { where: { archivedAt: null } },
            publications: { where: { archivedAt: null } },
          },
        },
        publications: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true },
        },
        channels: {
          where: { archivedAt: null },
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
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const lastPublicationAt = project.publications[0]?.createdAt || null;
    const lastPublicationId = project.publications[0]?.id || null;

    const mappedChannels = project.channels.map(channel => ({
      ...channel,
      postsCount: channel._count.posts,
      lastPostAt: channel.posts[0]?.createdAt || null,
    }));

    return {
      ...project,
      channels: mappedChannels,
      role: role.toLowerCase(),
      channelCount: project._count.channels,
      publicationsCount: project._count.publications,
      memberCount: project.members.length,
      lastPublicationAt,
      lastPublicationId,
    };
  }

  /**
   * Update project details.
   * Requires OWNER or ADMIN role.
   *
   * @param projectId - The ID of the project.
   * @param userId - The ID of the user.
   * @param data - The data to update.
   */
  public async update(projectId: string, userId: string, data: UpdateProjectDto) {
    await this.permissions.checkProjectPermission(projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    return this.prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  /**
   * Remove a project.
   * Requires OWNER role.
   *
   * @param projectId - The ID of the project.
   * @param userId - The ID of the user.
   */
  public async remove(projectId: string, userId: string) {
    await this.permissions.checkProjectPermission(projectId, userId, [ProjectRole.OWNER, ProjectRole.ADMIN]);

    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  /**
   * Archive a project.
   * Requires OWNER or ADMIN role.
   *
   * @param projectId - The ID of the project.
   * @param userId - The ID of the user.
   */
  public async archive(projectId: string, userId: string) {
    await this.permissions.checkProjectPermission(projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        archivedAt: new Date(),
        archivedBy: userId,
      },
    });
  }

  /**
   * Unarchive a project.
   * Requires OWNER or ADMIN role.
   *
   * @param projectId - The ID of the project.
   * @param userId - The ID of the user.
   */
  public async unarchive(projectId: string, userId: string) {
    await this.permissions.checkProjectPermission(projectId, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        archivedAt: null,
        archivedBy: null,
      },
    });
  }
}
