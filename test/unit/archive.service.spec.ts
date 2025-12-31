import { Test, TestingModule } from '@nestjs/testing';
import { ArchiveService } from '../../src/modules/archive/archive.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';
import { ArchiveEntityType } from '../../src/modules/archive/dto/archive.dto.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ArchiveService', () => {
    let service: ArchiveService;
    let prisma: PrismaService;

    const mockPrismaService = {
        project: {
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
        },
        channel: {
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
        },
        publication: {
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
        },
        post: {
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ArchiveService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<ArchiveService>(ArchiveService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('archiveEntity', () => {
        it('should archive a project', async () => {
            const projectId = 'project-1';
            const userId = 'user-1';
            const mockProject = { id: projectId, name: 'Test Project' };

            mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
            mockPrismaService.project.update.mockResolvedValue({
                ...mockProject,
                archivedAt: new Date(),
                archivedBy: userId,
            });

            await service.archiveEntity(ArchiveEntityType.PROJECT, projectId, userId);

            expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
                where: { id: projectId },
            });
            expect(mockPrismaService.project.update).toHaveBeenCalledWith({
                where: { id: projectId },
                data: {
                    archivedAt: expect.any(Date),
                    archivedBy: userId,
                },
            });
        });

        it('should throw NotFoundException if entity does not exist', async () => {
            const projectId = 'non-existent';
            const userId = 'user-1';

            mockPrismaService.project.findUnique.mockResolvedValue(null);

            await expect(
                service.archiveEntity(ArchiveEntityType.PROJECT, projectId, userId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if entity is already archived', async () => {
            const projectId = 'project-1';
            const userId = 'user-1';
            const mockProject = {
                id: projectId,
                name: 'Test Project',
                archivedAt: new Date(),
            };

            mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

            await expect(
                service.archiveEntity(ArchiveEntityType.PROJECT, projectId, userId),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('restoreEntity', () => {
        it('should restore an archived project', async () => {
            const projectId = 'project-1';
            const mockProject = {
                id: projectId,
                name: 'Test Project',
                archivedAt: new Date(),
                archivedBy: 'user-1',
            };

            mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
            mockPrismaService.project.update.mockResolvedValue({
                ...mockProject,
                archivedAt: null,
                archivedBy: null,
            });

            await service.restoreEntity(ArchiveEntityType.PROJECT, projectId);

            expect(mockPrismaService.project.update).toHaveBeenCalledWith({
                where: { id: projectId },
                data: {
                    archivedAt: null,
                    archivedBy: null,
                },
            });
        });

        it('should throw NotFoundException if entity does not exist', async () => {
            const projectId = 'non-existent';

            mockPrismaService.project.findUnique.mockResolvedValue(null);

            await expect(
                service.restoreEntity(ArchiveEntityType.PROJECT, projectId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if entity is not archived', async () => {
            const projectId = 'project-1';
            const mockProject = {
                id: projectId,
                name: 'Test Project',
                archivedAt: null,
            };

            mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

            await expect(
                service.restoreEntity(ArchiveEntityType.PROJECT, projectId),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('deleteEntityPermanently', () => {
        it('should permanently delete an archived project', async () => {
            const projectId = 'project-1';
            const mockProject = {
                id: projectId,
                name: 'Test Project',
                archivedAt: new Date(),
            };

            mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
            mockPrismaService.project.delete.mockResolvedValue(mockProject);

            await service.deleteEntityPermanently(
                ArchiveEntityType.PROJECT,
                projectId,
            );

            expect(mockPrismaService.project.delete).toHaveBeenCalledWith({
                where: { id: projectId },
            });
        });

        it('should throw NotFoundException if entity does not exist', async () => {
            const projectId = 'non-existent';

            mockPrismaService.project.findUnique.mockResolvedValue(null);

            await expect(
                service.deleteEntityPermanently(ArchiveEntityType.PROJECT, projectId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if entity is not archived', async () => {
            const projectId = 'project-1';
            const mockProject = {
                id: projectId,
                name: 'Test Project',
                archivedAt: null,
            };

            mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

            await expect(
                service.deleteEntityPermanently(ArchiveEntityType.PROJECT, projectId),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('isEntityArchived', () => {
        it('should return true if project is archived', async () => {
            const projectId = 'project-1';
            const mockProject = {
                id: projectId,
                archivedAt: new Date(),
            };

            mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

            const result = await service.isEntityArchived(
                ArchiveEntityType.PROJECT,
                projectId,
            );

            expect(result).toBe(true);
        });

        it('should return true if channel is archived via project (virtual cascading)', async () => {
            const channelId = 'channel-1';
            const mockChannel = {
                id: channelId,
                archivedAt: null,
                project: {
                    archivedAt: new Date(),
                },
            };

            mockPrismaService.channel.findUnique.mockResolvedValue(mockChannel);

            const result = await service.isEntityArchived(
                ArchiveEntityType.CHANNEL,
                channelId,
            );

            expect(result).toBe(true);
        });

        it('should return true if post is archived via channel (virtual cascading)', async () => {
            const postId = 'post-1';
            const mockPost = {
                id: postId,
                archivedAt: null,
                channel: {
                    archivedAt: new Date(),
                    project: {
                        archivedAt: null,
                    },
                },
            };

            mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

            const result = await service.isEntityArchived(
                ArchiveEntityType.POST,
                postId,
            );

            expect(result).toBe(true);
        });

        it('should return false if entity is not archived', async () => {
            const projectId = 'project-1';
            const mockProject = {
                id: projectId,
                archivedAt: null,
            };

            mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

            const result = await service.isEntityArchived(
                ArchiveEntityType.PROJECT,
                projectId,
            );

            expect(result).toBe(false);
        });
    });

    describe('getArchiveStats', () => {
        it('should return archive statistics', async () => {
            mockPrismaService.project.count.mockResolvedValue(5);
            mockPrismaService.channel.count.mockResolvedValue(10);
            mockPrismaService.publication.count.mockResolvedValue(3);
            mockPrismaService.post.count.mockResolvedValue(20);

            const stats = await service.getArchiveStats();

            expect(stats).toEqual({
                projects: 5,
                channels: 10,
                publications: 3,
                posts: 20,
                total: 38,
            });
        });
    });

    describe('moveEntity', () => {
        it('should move a channel to a different project', async () => {
            const channelId = 'channel-1';
            const targetProjectId = 'project-2';
            const mockChannel = {
                id: channelId,
                projectId: 'project-1',
            };
            const mockTargetProject = {
                id: targetProjectId,
            };

            mockPrismaService.channel.findUnique.mockResolvedValue(mockChannel);
            mockPrismaService.project.findUnique.mockResolvedValue(
                mockTargetProject,
            );
            mockPrismaService.channel.update.mockResolvedValue({
                ...mockChannel,
                projectId: targetProjectId,
            });

            await service.moveEntity(
                ArchiveEntityType.CHANNEL,
                channelId,
                targetProjectId,
            );

            expect(mockPrismaService.channel.update).toHaveBeenCalledWith({
                where: { id: channelId },
                data: { projectId: targetProjectId },
            });
        });

        it('should throw NotFoundException if target parent does not exist', async () => {
            const channelId = 'channel-1';
            const targetProjectId = 'non-existent';
            const mockChannel = {
                id: channelId,
                projectId: 'project-1',
            };

            mockPrismaService.channel.findUnique.mockResolvedValue(mockChannel);
            mockPrismaService.project.findUnique.mockResolvedValue(null);

            await expect(
                service.moveEntity(
                    ArchiveEntityType.CHANNEL,
                    channelId,
                    targetProjectId,
                ),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
