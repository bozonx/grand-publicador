import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Project, ProjectMember } from '@prisma/client';

@Injectable()
export class BlogsService {
    constructor(private prisma: PrismaService) { }

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
                    role: 'OWNER',
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
        const membership = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId },
            },
        });

        if (!membership) {
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

        return { ...project, role: membership.role };
    }

    async update(projectId: string, userId: string, data: { name?: string; description?: string }) {
        await this.checkPermission(projectId, userId, ['OWNER', 'ADMIN']);
        return this.prisma.project.update({
            where: { id: projectId },
            data,
        });
    }

    async remove(projectId: string, userId: string) {
        await this.checkPermission(projectId, userId, ['OWNER']);
        return this.prisma.project.delete({
            where: { id: projectId },
        });
    }

    private async checkPermission(projectId: string, userId: string, allowedRoles: string[]) {
        const membership = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId },
            },
        });

        if (!membership || !allowedRoles.includes(membership.role)) {
            throw new ForbiddenException('Insufficient permissions');
        }
    }
}
