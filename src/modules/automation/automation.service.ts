
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PostStatus, Prisma } from '@prisma/client';

@Injectable()
export class AutomationService {
    private readonly logger = new Logger(AutomationService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get posts that are ready to be published
     * Status: SCHEDULED and scheduledAt <= now
     */
    async getPendingPosts(limit: number = 10, lookbackMinutes: number = 60) {
        const now = new Date();
        const lookbackDate = new Date(now.getTime() - lookbackMinutes * 60 * 1000);

        // 1. Mark overdue posts as EXPIRED
        await this.prisma.post.updateMany({
            where: {
                status: PostStatus.SCHEDULED,
                scheduledAt: {
                    lt: lookbackDate,
                },
            },
            data: {
                status: PostStatus.EXPIRED,
                meta: JSON.stringify({
                    expiredAt: now.toISOString(),
                    reason: 'Post too old to publish',
                }),
            },
        });

        // 2. Get pending posts within the window
        return this.prisma.post.findMany({
            where: {
                status: PostStatus.SCHEDULED,
                scheduledAt: {
                    lte: now,
                    gte: lookbackDate,
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
        this.logger.log(`Claiming post ${postId}`);

        return this.prisma.$transaction(async (tx) => {
            const post = await tx.post.findUnique({
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

            // Parse meta and check processing flag
            const meta = JSON.parse(post.meta);
            if (meta.processing) {
                throw new Error('Post is already being processed');
            }

            // Atomic update within transaction
            // We could also check version if we had one, but strict transaction isolation
            // or select for update would be even better. Since we are in a transaction
            // and checking permissions, this is reasonably safe for this scale.
            return tx.post.update({
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
        this.logger.log(`Updating post ${postId} status to ${status}`);

        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new Error('Post not found');
        }

        const meta = JSON.parse(post.meta);
        delete meta.processing;

        const updateData: Prisma.PostUpdateInput = {
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
