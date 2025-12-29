import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Blog, BlogMember, User } from '@prisma/client';

@Injectable()
export class BlogsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: { name: string; description?: string }): Promise<Blog> {
        return this.prisma.$transaction(async (tx) => {
            const blog = await tx.blog.create({
                data: {
                    name: data.name,
                    description: data.description,
                    ownerId: userId,
                },
            });

            await tx.blogMember.create({
                data: {
                    blogId: blog.id,
                    userId: userId,
                    role: 'owner',
                },
            });

            return blog;
        });
    }

    async findAllForUser(userId: string) {
        return this.prisma.blog.findMany({
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

    async findOne(blogId: string, userId: string): Promise<Blog & { role: string }> {
        const membership = await this.prisma.blogMember.findUnique({
            where: {
                blogId_userId: { blogId, userId },
            },
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this blog');
        }

        const blog = await this.prisma.blog.findUnique({
            where: { id: blogId },
            include: {
                channels: true,
                members: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!blog) {
            throw new NotFoundException('Blog not found');
        }

        return { ...blog, role: membership.role };
    }

    async update(blogId: string, userId: string, data: { name?: string; description?: string }) {
        await this.checkPermission(blogId, userId, ['owner', 'admin']);
        return this.prisma.blog.update({
            where: { id: blogId },
            data,
        });
    }

    async remove(blogId: string, userId: string) {
        await this.checkPermission(blogId, userId, ['owner']);
        return this.prisma.blog.delete({
            where: { id: blogId },
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
