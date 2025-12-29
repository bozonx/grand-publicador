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
    ) { }

    async create(userId: string, channelId: string, data: {
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
    }) {
        const channel = await this.channelsService.findOne(channelId, userId);
        await this.permissions.checkProjectPermission(
            channel.projectId,
            userId,
            [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.EDITOR],
        );

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

    async findAllForChannel(channelId: string, userId: string) {
        await this.channelsService.findOne(channelId, userId); // Validates access
        return this.prisma.post.findMany({
            where: { channelId },
            orderBy: { createdAt: 'desc' },
        });
    }

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

    async update(id: string, userId: string, data: {
        content?: string;
        title?: string;
        description?: string;
        authorComment?: string;
        tags?: string;
        mediaFiles?: any;
        status?: PostStatus;
        scheduledAt?: Date;
        publishedAt?: Date;
    }) {
        const post = await this.findOne(id, userId);

        // Permission: Only author or admin/owner of the project can update
        if (post.authorId !== userId) {
            const channel = await this.prisma.channel.findUnique({ where: { id: post.channelId } });
            if (channel) {
                await this.permissions.checkProjectPermission(
                    channel.projectId,
                    userId,
                    [ProjectRole.OWNER, ProjectRole.ADMIN],
                );
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

    async remove(id: string, userId: string) {
        const post = await this.findOne(id, userId);

        // Permission: Only author or admin/owner of the project can delete
        if (post.authorId !== userId) {
            const channel = await this.prisma.channel.findUnique({ where: { id: post.channelId } });
            if (channel) {
                await this.permissions.checkProjectPermission(
                    channel.projectId,
                    userId,
                    [ProjectRole.OWNER, ProjectRole.ADMIN],
                );
            } else {
                throw new ForbiddenException('Insufficient permissions');
            }
        }

        return this.prisma.post.delete({
            where: { id },
        });
    }
}
