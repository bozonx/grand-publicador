import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service.js';
import { ProjectRole } from '@prisma/client';

/**
 * Centralized service for checking project access permissions
 * Eliminates code duplication across multiple services
 */
@Injectable()
export class PermissionsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Check if user has access to project (any role or owner)
     */
    async checkProjectAccess(projectId: string, userId: string): Promise<void> {
        const membership = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId },
            },
        });

        if (!membership) {
            // Check if user is owner
            const project = await this.prisma.project.findUnique({
                where: { id: projectId },
                select: { ownerId: true },
            });

            if (!project || project.ownerId !== userId) {
                throw new ForbiddenException('You do not have access to this project');
            }
        }
    }

    /**
     * Check if user has specific permissions in project
     * Owner always has access regardless of membership role
     */
    async checkProjectPermission(
        projectId: string,
        userId: string,
        allowedRoles: ProjectRole[],
    ): Promise<void> {
        // First check if user is owner
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { ownerId: true },
        });

        if (!project) {
            throw new ForbiddenException('Project not found');
        }

        // Owner always has access
        if (project.ownerId === userId) {
            return;
        }

        // Check membership role
        const membership = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId },
            },
        });

        if (!membership || !allowedRoles.includes(membership.role)) {
            throw new ForbiddenException('Insufficient permissions');
        }
    }

    /**
     * Get user's role in project
     * Returns 'OWNER' if user is project owner, otherwise returns membership role
     */
    async getUserProjectRole(projectId: string, userId: string): Promise<ProjectRole | null> {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { ownerId: true },
        });

        if (!project) {
            return null;
        }

        // Check if user is owner
        if (project.ownerId === userId) {
            return ProjectRole.OWNER;
        }

        // Check membership
        const membership = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId },
            },
        });

        return membership?.role ?? null;
    }
}
