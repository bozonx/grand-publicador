import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PermissionsService } from '../../common/services/permissions.service.js';
import { Project, ProjectRole } from '@prisma/client';

@Injectable()
export class BlogsService {
    constructor(
        private prisma: PrismaService,
        private permissions: PermissionsService,
    ) { }

    async create(userId: string, data: { name: string; description?: string }): Promise<Project> {
        return this.prisma.$transaction(async (tx) => {
            const project = await tx.project.create({
                data: {
                    name: data.name,
                    description: data.description,
                    ownerId: userId,
                },
            });

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

    async findAllForUser(userId: string) {
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
        });
    }

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

    async update(projectId: string, userId: string, data: { name?: string; description?: string }) {
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
