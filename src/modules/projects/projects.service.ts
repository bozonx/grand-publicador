
import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PermissionsService } from '../../common/services/permissions.service.js';
import { Project, ProjectRole, Prisma } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from './dto/index.js';

@Injectable()
export class ProjectsService {
    private readonly logger = new Logger(ProjectsService.name);

    constructor(
        private prisma: PrismaService,
        private permissions: PermissionsService,
    ) { }

    /**
     * Creates a new project
     */
    async create(userId: string, data: CreateProjectDto): Promise<Project> {
        this.logger.log(`Creating project "${data.name}" for user ${userId}`);

        return this.prisma.$transaction(async (tx) => {
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
     * Returns all projects available to the user
     */
    async findAllForUser(userId: string, options?: { limit?: number; offset?: number }) {
        const take = options?.limit ?? 50;
        const skip = options?.offset ?? 0;

        return this.prisma.project.findMany({
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
    }

    /**
     * Find one project by ID with security check
     */
    async findOne(projectId: string, userId: string): Promise<Project & { role: string }> {
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

        return { ...project, role };
    }

    /**
     * Update project details
     */
    async update(projectId: string, userId: string, data: UpdateProjectDto) {
        await this.permissions.checkProjectPermission(
            projectId,
            userId,
            [ProjectRole.OWNER, ProjectRole.ADMIN],
        );

        return this.prisma.project.update({
            where: { id: projectId },
            data,
        });
    }

    /**
     * Remove project
     */
    async remove(projectId: string, userId: string) {
        await this.permissions.checkProjectPermission(
            projectId,
            userId,
            [ProjectRole.OWNER],
        );

        return this.prisma.project.delete({
            where: { id: projectId },
        });
    }
}
