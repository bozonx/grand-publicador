import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PostStatus, ProjectRole, Prisma } from '@prisma/client';
import type { CreatePublicationDto, UpdatePublicationDto } from './dto/index.js';
import { PermissionsService } from '../../common/services/permissions.service.js';

@Injectable()
export class PublicationsService {
    constructor(
        private prisma: PrismaService,
        private permissions: PermissionsService,
    ) { }

    /**
     * Create a new publication
     */
    async create(userId: string, data: CreatePublicationDto) {
        // Check if user has access to the project
        await this.permissions.checkProjectAccess(data.projectId, userId);

        return this.prisma.publication.create({
            data: {
                projectId: data.projectId,
                authorId: userId,
                title: data.title,
                content: data.content,
                mediaFiles: JSON.stringify(data.mediaFiles || []),
                tags: data.tags,
                status: data.status || PostStatus.DRAFT,
                meta: JSON.stringify(data.meta || {}),
            },
        });
    }

    /**
     * Find all publications for a project
     */
    async findAll(
        projectId: string,
        userId: string,
        filters?: {
            status?: PostStatus;
            limit?: number;
            offset?: number;
        },
    ) {
        await this.permissions.checkProjectAccess(projectId, userId);

        const where: Prisma.PublicationWhereInput = { projectId };
        if (filters?.status) {
            where.status = filters.status;
        }

        return this.prisma.publication.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
                posts: {
                    include: {
                        channel: true,
                    },
                },
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: filters?.limit,
            skip: filters?.offset,
        });
    }

    /**
     * Find one publication by ID
     */
    async findOne(id: string, userId: string) {
        const publication = await this.prisma.publication.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
                project: true,
                posts: {
                    include: {
                        channel: true,
                    },
                },
            },
        });

        if (!publication) {
            throw new NotFoundException('Publication not found');
        }

        await this.permissions.checkProjectAccess(publication.projectId, userId);

        return publication;
    }

    /**
     * Update a publication
     */
    async update(id: string, userId: string, data: UpdatePublicationDto) {
        const publication = await this.findOne(id, userId);

        // Check if user is author or has admin rights
        if (publication.authorId !== userId) {
            await this.permissions.checkProjectPermission(
                publication.projectId,
                userId,
                [ProjectRole.OWNER, ProjectRole.ADMIN],
            );
        }

        return this.prisma.publication.update({
            where: { id },
            data: {
                title: data.title,
                content: data.content,
                mediaFiles: data.mediaFiles
                    ? JSON.stringify(data.mediaFiles)
                    : undefined,
                tags: data.tags,
                status: data.status,
                meta: data.meta ? JSON.stringify(data.meta) : undefined,
            },
        });
    }

    /**
     * Delete a publication
     */
    async remove(id: string, userId: string) {
        const publication = await this.findOne(id, userId);

        // Check if user is author or has admin rights
        if (publication.authorId !== userId) {
            await this.permissions.checkProjectPermission(
                publication.projectId,
                userId,
                [ProjectRole.OWNER, ProjectRole.ADMIN],
            );
        }

        return this.prisma.publication.delete({
            where: { id },
        });
    }

    /**
     * Create posts from publication for specified channels
     */
    async createPostsFromPublication(
        publicationId: string,
        userId: string,
        channelIds: string[],
        scheduledAt?: Date,
    ) {
        const publication = await this.findOne(publicationId, userId);

        // Verify all channels belong to the same project
        const channels = await this.prisma.channel.findMany({
            where: {
                id: { in: channelIds },
                projectId: publication.projectId,
            },
        });

        if (channels.length !== channelIds.length) {
            throw new NotFoundException('Some channels not found or do not belong to this project');
        }

        // Create posts for each channel
        const posts = await Promise.all(
            channels.map((channel) =>
                this.prisma.post.create({
                    data: {
                        publicationId: publication.id,
                        channelId: channel.id,
                        authorId: userId,
                        content: publication.content,
                        socialMedia: channel.socialMedia,
                        postType: 'POST',
                        title: publication.title,
                        tags: publication.tags,
                        mediaFiles: publication.mediaFiles,
                        status: scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT,
                        scheduledAt,
                        meta: publication.meta,
                    },
                }),
            ),
        );

        return posts;
    }

}
