import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChannelsService } from '../channels/channels.service.js';

@Injectable()
export class PostsService {
    constructor(
        private prisma: PrismaService,
        private channelsService: ChannelsService,
    ) { }

    async create(userId: string, channelId: string, data: {
        content: string;
        socialMedia: string;
        postType: string;
        title?: string;
        description?: string;
        authorComment?: string;
        tags?: string;
        mediaFiles?: any;
        scheduledAt?: Date;
        status?: string;
    }) {
        const channel = await this.channelsService.findOne(channelId, userId);
        await this.checkPermission(channel.blogId, userId, ['owner', 'admin', 'editor']);

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
                status: data.status || 'draft',
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
        status?: string;
        scheduledAt?: Date;
        publishedAt?: Date;
    }) {
        const post = await this.findOne(id, userId);

        // Permission: Only author or admin/owner of the blog can update
        if (post.authorId !== userId) {
            const channel = await this.prisma.channel.findUnique({ where: { id: post.channelId } });
            if (channel) {
                await this.checkPermission(channel.blogId, userId, ['owner', 'admin']);
            } else {
                throw new ForbiddenException('Insufficient permissions');
            }
        }

        return this.prisma.post.update({
            where: { id },
            data: {
                ...data,
                mediaFiles: data.mediaFiles ? JSON.stringify(data.mediaFiles) : undefined,
            },
        });
    }

    async remove(id: string, userId: string) {
        const post = await this.findOne(id, userId);

        // Permission: Only author or admin/owner of the blog can delete
        if (post.authorId !== userId) {
            const channel = await this.prisma.channel.findUnique({ where: { id: post.channelId } });
            if (channel) {
                await this.checkPermission(channel.blogId, userId, ['owner', 'admin']);
            } else {
                throw new ForbiddenException('Insufficient permissions');
            }
        }

        return this.prisma.post.delete({
            where: { id },
        });
    }

    private async checkPermission(blogId: string, userId: string, allowedRoles: string[]) {
        const membership = await this.prisma.blogMember.findUnique({
            where: {
                blogId_userId: { blogId, userId },
            },
        });

        if (!membership || !allowedRoles.includes(membership.role)) {
            throw new ForbiddenException('Insufficient permissions');
        }
    }
}
