import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProjectRole, type Project } from '@prisma/client';

import { PermissionsService } from '../../common/services/permissions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProjectDto, UpdateProjectDto } from './dto/index.js';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsService,
  ) {}

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

    return this.prisma.$transaction(async tx => {
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

      return project;
    });
  }

  /**
   * Returns all projects available to the user.
   * Filters projects where the user is a member (including owner).
   *
   * @param userId - The ID of the user.
   * @param options - Pagination options (limit, offset).
   * @returns A list of projects including member count and channel count.
   */
  public async findAllForUser(userId: string, options?: { limit?: number; offset?: number }) {
    const take = options?.limit ?? 50;
    const skip = options?.offset ?? 0;

    const projects = await this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: true,
        _count: {
          select: { channels: true },
        },
      },
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    });

    return projects.map(project => {
      const userMember = project.members.find(m => m.userId === userId);
      return {
        ...project,
        role: userMember?.role?.toLowerCase(),
        channelCount: project._count.channels,
        memberCount: project.members.length,
      };
    });
  }

  /**
   * Find one project by ID with security check.
   * Verifies that the user is a member of the project before returning it.
   *
   * @param projectId - The ID of the project.
   * @param userId - The ID of the user.
   * @returns The project details including channels, members, and the user's role.
   * @throws ForbiddenException if the user is not a member.
   * @throws NotFoundException if the project does not exist.
   */
  public async findOne(projectId: string, userId: string): Promise<any> {
    const role = await this.permissions.getUserProjectRole(projectId, userId);

    if (!role) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        channels: true,
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

    return {
      ...project,
      role: role.toLowerCase(),
      channelCount: project.channels.length,
      memberCount: project.members.length,
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
    await this.permissions.checkProjectPermission(projectId, userId, [ProjectRole.OWNER]);

    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }
}
