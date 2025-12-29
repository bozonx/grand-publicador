import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BlogsService } from '../blogs/blogs.service.js';
import { PermissionsService } from '../../common/services/permissions.service.js';
import { SocialMedia, ProjectRole } from '@prisma/client';

@Injectable()
export class ChannelsService {
    constructor(
        private prisma: PrismaService,
        private blogsService: BlogsService,
        private permissions: PermissionsService,
    ) { }

    async create(userId: string, projectId: string, data: {
        socialMedia: SocialMedia;
        name: string;
        channelIdentifier: string;
        credentials?: any;
    }) {
        await this.permissions.checkProjectPermission(
            projectId,
            userId,
            [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.EDITOR],
        );

        return this.prisma.channel.create({
            data: {
                projectId,
                socialMedia: data.socialMedia,
                name: data.name,
                channelIdentifier: data.channelIdentifier,
                credentials: JSON.stringify(data.credentials || {}),
            },
        });
    }

    async findAllForProject(projectId: string, userId: string) {
        await this.blogsService.findOne(projectId, userId); // Validates membership
        return this.prisma.channel.findMany({
            where: { projectId },
            include: {
                _count: {
                    select: { posts: true },
                },
            },
        });
    }

    async findOne(id: string, userId: string) {
        const channel = await this.prisma.channel.findUnique({
            where: { id },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found');
        }

        await this.blogsService.findOne(channel.projectId, userId);
        return channel;
    }

    async update(id: string, userId: string, data: {
        name?: string;
        channelIdentifier?: string;
        credentials?: any;
        isActive?: boolean;
    }) {
        const channel = await this.findOne(id, userId);
        await this.permissions.checkProjectPermission(
            channel.projectId,
            userId,
            [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.EDITOR],
        );

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

    async remove(id: string, userId: string) {
        const channel = await this.findOne(id, userId);
        await this.permissions.checkProjectPermission(
            channel.projectId,
            userId,
            [ProjectRole.OWNER, ProjectRole.ADMIN],
        );

        return this.prisma.channel.delete({
            where: { id },
        });
    }
}
