import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ArchiveEntityType, ArchiveStatsDto } from './dto/archive.dto.js';

@Injectable()
export class ArchiveService {
    constructor(private readonly prisma: PrismaService) { }

    async archiveEntity(type: ArchiveEntityType, id: string, userId: string) {
        const data = {
            archivedAt: new Date(),
            archivedBy: userId,
        };

        switch (type) {
            case ArchiveEntityType.PROJECT:
                return (this.prisma.project as any).update({ where: { id }, data });
            case ArchiveEntityType.CHANNEL:
                return (this.prisma.channel as any).update({ where: { id }, data });
            case ArchiveEntityType.PUBLICATION:
                return (this.prisma.publication as any).update({ where: { id }, data });
            case ArchiveEntityType.POST:
                return (this.prisma.post as any).update({ where: { id }, data });
            default:
                throw new BadRequestException('Invalid entity type');
        }
    }

    async restoreEntity(type: ArchiveEntityType, id: string) {
        const data = {
            archivedAt: null,
            archivedBy: null,
        };

        switch (type) {
            case ArchiveEntityType.PROJECT:
                return (this.prisma.project as any).update({ where: { id }, data });
            case ArchiveEntityType.CHANNEL:
                return (this.prisma.channel as any).update({ where: { id }, data });
            case ArchiveEntityType.PUBLICATION:
                return (this.prisma.publication as any).update({ where: { id }, data });
            case ArchiveEntityType.POST:
                return (this.prisma.post as any).update({ where: { id }, data });
            default:
                throw new BadRequestException('Invalid entity type');
        }
    }

    async deleteEntityPermanently(type: ArchiveEntityType, id: string) {
        switch (type) {
            case ArchiveEntityType.PROJECT:
                return this.prisma.project.delete({ where: { id } });
            case ArchiveEntityType.CHANNEL:
                return this.prisma.channel.delete({ where: { id } });
            case ArchiveEntityType.PUBLICATION:
                return this.prisma.publication.delete({ where: { id } });
            case ArchiveEntityType.POST:
                return this.prisma.post.delete({ where: { id } });
            default:
                throw new BadRequestException('Invalid entity type');
        }
    }

    async moveEntity(type: ArchiveEntityType, id: string, targetParentId: string) {
        switch (type) {
            case ArchiveEntityType.CHANNEL:
                // Move channel to another project
                return this.prisma.channel.update({
                    where: { id },
                    data: { projectId: targetParentId },
                });

            case ArchiveEntityType.POST:
                // Check if target is a channel or publication
                const channel = await this.prisma.channel.findUnique({ where: { id: targetParentId } });
                if (channel) {
                    return this.prisma.post.update({
                        where: { id },
                        data: { channelId: targetParentId },
                    });
                }

                const publication = await this.prisma.publication.findUnique({ where: { id: targetParentId } });
                if (publication) {
                    return this.prisma.post.update({
                        where: { id },
                        data: { publicationId: targetParentId },
                    });
                }
                throw new NotFoundException('Target parent not found');

            case ArchiveEntityType.PUBLICATION:
                // Move publication to another project
                return this.prisma.publication.update({
                    where: { id },
                    data: { projectId: targetParentId },
                });

            default:
                throw new BadRequestException('Moving not supported for this entity type');
        }
    }

    async isEntityArchived(type: ArchiveEntityType, id: string): Promise<boolean> {
        switch (type) {
            case ArchiveEntityType.POST:
                const post = await this.prisma.post.findUnique({
                    where: { id },
                    include: {
                        channel: { include: { project: true } },
                        publication: { include: { project: true } }
                    },
                } as any);
                if (!post) return false;
                return !!(
                    (post as any).archivedAt ||
                    (post as any).channel.archivedAt ||
                    (post as any).channel.project.archivedAt ||
                    ((post as any).publication && ((post as any).publication.archivedAt || (post as any).publication.project.archivedAt))
                );

            case ArchiveEntityType.CHANNEL:
                const channel = await this.prisma.channel.findUnique({
                    where: { id },
                    include: { project: true },
                } as any);
                if (!channel) return false;
                return !!((channel as any).archivedAt || (channel as any).project.archivedAt);

            case ArchiveEntityType.PUBLICATION:
                const publication = await this.prisma.publication.findUnique({
                    where: { id },
                    include: { project: true },
                } as any);
                if (!publication) return false;
                return !!((publication as any).archivedAt || (publication as any).project.archivedAt);

            case ArchiveEntityType.PROJECT:
                const project = await this.prisma.project.findUnique({ where: { id } } as any);
                return !!((project as any)?.archivedAt);

            default:
                return false;
        }
    }

    async getArchiveStats(): Promise<ArchiveStatsDto> {
        const [projects, channels, publications, posts] = await Promise.all([
            (this.prisma.project as any).count({ where: { archivedAt: { not: null } } }),
            (this.prisma.channel as any).count({ where: { archivedAt: { not: null } } }),
            (this.prisma.publication as any).count({ where: { archivedAt: { not: null } } }),
            (this.prisma.post as any).count({ where: { archivedAt: { not: null } } }),
        ]);

        return {
            projects,
            channels,
            publications,
            posts,
            total: projects + channels + publications + posts,
        };
    }

    async getArchivedEntities(type: ArchiveEntityType) {
        switch (type) {
            case ArchiveEntityType.PROJECT:
                return (this.prisma.project as any).findMany({ where: { archivedAt: { not: null } } });
            case ArchiveEntityType.CHANNEL:
                return (this.prisma.channel as any).findMany({ where: { archivedAt: { not: null } } });
            case ArchiveEntityType.PUBLICATION:
                return (this.prisma.publication as any).findMany({ where: { archivedAt: { not: null } } });
            case ArchiveEntityType.POST:
                return (this.prisma.post as any).findMany({ where: { archivedAt: { not: null } } });
            default:
                throw new BadRequestException('Invalid entity type');
        }
    }
}
