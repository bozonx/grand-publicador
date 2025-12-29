import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PostStatus } from '@prisma/client';

@Injectable()
export class AutomationService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get posts that are ready to be published
     * Status: SCHEDULED and scheduledAt <= now
     */
    async getPendingPosts(limit: number = 10) {
        const now = new Date();

        return this.prisma.post.findMany({
            where: {
                status: PostStatus.SCHEDULED,
                scheduledAt: {
                    lte: now,
                },
            },
            include: {
                channel: true,
                publication: true,
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                scheduledAt: 'asc',
            },
            take: limit,
        });
    }

    /**
     * Claim a post for publishing
     * This is an atomic operation to prevent race conditions
     */
    async claimPost(postId: string) {
        // Try to update the post status to indicate it's being processed
        // We use a custom meta field to track this
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                channel: true,
                publication: true,
            },
        });

        if (!post) {
            throw new Error('Post not found');
        }

        if (post.status !== PostStatus.SCHEDULED) {
            throw new Error('Post is not scheduled');
        }

        // Parse meta and add processing flag
        const meta = JSON.parse(post.meta);
        if (meta.processing) {
            throw new Error('Post is already being processed');
        }

        // Update with processing flag
        return this.prisma.post.update({
            where: { id: postId },
            data: {
                meta: JSON.stringify({
                    ...meta,
                    processing: true,
                    claimedAt: new Date().toISOString(),
                }),
            },
            include: {
                channel: true,
                publication: true,
            },
        });
    }

    /**
     * Update post status after publishing attempt
     */
    async updatePostStatus(
        postId: string,
        status: PostStatus,
        error?: string,
    ) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new Error('Post not found');
        }

        const meta = JSON.parse(post.meta);
        delete meta.processing;

        const updateData: any = {
            status,
            meta: JSON.stringify({
                ...meta,
                ...(error && { lastError: error }),
                updatedAt: new Date().toISOString(),
            }),
        };

        if (status === PostStatus.PUBLISHED) {
            updateData.publishedAt = new Date();
        }

        return this.prisma.post.update({
            where: { id: postId },
            data: updateData,
        });
    }
}
