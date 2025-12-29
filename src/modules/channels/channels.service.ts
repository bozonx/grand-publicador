import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BlogsService } from '../blogs/blogs.service.js';

@Injectable()
export class ChannelsService {
    constructor(
        private prisma: PrismaService,
        private blogsService: BlogsService,
    ) { }

    async create(userId: string, blogId: string, data: {
        socialMedia: string;
        name: string;
        channelIdentifier: string;
        credentials?: any;
    }) {
        await this.checkPermission(blogId, userId, ['owner', 'admin', 'editor']);

        return this.prisma.channel.create({
            data: {
                blogId,
                socialMedia: data.socialMedia,
                name: data.name,
                channelIdentifier: data.channelIdentifier,
                credentials: JSON.stringify(data.credentials || {}),
            },
        });
    }

    async findAllForBlog(blogId: string, userId: string) {
        await this.blogsService.findOne(blogId, userId); // Validates membership
        return this.prisma.channel.findMany({
            where: { blogId },
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

        await this.blogsService.findOne(channel.blogId, userId);
        return channel;
    }

    async update(id: string, userId: string, data: {
        name?: string;
        channelIdentifier?: string;
        credentials?: any;
        isActive?: boolean;
    }) {
        const channel = await this.findOne(id, userId);
        await this.checkPermission(channel.blogId, userId, ['owner', 'admin', 'editor']);

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
        await this.checkPermission(channel.blogId, userId, ['owner', 'admin']);

        return this.prisma.channel.delete({
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
