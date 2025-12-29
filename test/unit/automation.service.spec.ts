
import { Test, type TestingModule } from '@nestjs/testing';
import { AutomationService } from '../../src/modules/automation/automation.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';
import { jest } from '@jest/globals';

describe('AutomationService (unit)', () => {
    let service: AutomationService;
    let prisma: PrismaService;
    let moduleRef: TestingModule;

    const mockPrismaService = {
        // Mock $transaction to immediately execute the callback, passing this mock object as 'tx'
        $transaction: jest.fn((callback: (tx: any) => Promise<any>) => callback(mockPrismaService)),
        post: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
    };

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            providers: [
                AutomationService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = moduleRef.get<AutomationService>(AutomationService);
        prisma = moduleRef.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        await moduleRef.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Re-implement default behavior for $transaction in case it was overridden
        mockPrismaService.$transaction.mockImplementation((callback: (tx: any) => any) => callback(mockPrismaService));
    });

    describe('getPendingPosts', () => {
        it('should return posts scheduled for now or earlier', async () => {
            const now = new Date('2025-12-29T10:00:00Z');
            const OriginalDate = global.Date;
            jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
                if (args.length) {
                    return new OriginalDate(...args as [any]);
                }
                return now;
            });

            const mockPosts = [
                {
                    id: 'post-1',
                    status: 'SCHEDULED',
                    scheduledAt: new Date('2025-12-29T09:00:00Z'), // Past
                },
                {
                    id: 'post-2',
                    status: 'SCHEDULED',
                    scheduledAt: new Date('2025-12-29T10:00:00Z'), // Now
                },
            ];

            mockPrismaService.post.findMany.mockResolvedValue(mockPosts);

            const result = await service.getPendingPosts(10);

            expect(result).toEqual(mockPosts);
            expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
                where: {
                    status: 'SCHEDULED',
                    scheduledAt: {
                        lte: now,
                        gte: new Date(now.getTime() - 60 * 60 * 1000), // Default 60 mins lookback
                    },
                },
                include: expect.objectContaining({
                    channel: true,
                    publication: true,
                    author: expect.anything(),
                }),
                orderBy: {
                    scheduledAt: 'asc',
                },
                take: 10,
            });

            jest.restoreAllMocks();
        });

        it('should respect limit parameter', async () => {
            mockPrismaService.post.findMany.mockResolvedValue([]);

            await service.getPendingPosts(5);

            expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 5,
                }),
            );
        });

        it('should use default limit of 10', async () => {
            mockPrismaService.post.findMany.mockResolvedValue([]);

            await service.getPendingPosts();

            expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 10,
                }),
            );
        });

        it('should order posts by scheduledAt ascending (oldest first)', async () => {
            mockPrismaService.post.findMany.mockResolvedValue([]);

            await service.getPendingPosts();

            expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: {
                        scheduledAt: 'asc',
                    },
                }),
            );
        });
    });

    describe('claimPost', () => {
        it('should successfully claim a scheduled post', async () => {
            const postId = 'post-1';
            const mockPost = {
                id: postId,
                status: 'SCHEDULED',
                meta: '{}',
            };

            mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

            const claimedPost = {
                ...mockPost,
                meta: JSON.stringify({
                    processing: true,
                    claimedAt: expect.any(String),
                }),
            };

            mockPrismaService.post.update.mockResolvedValue(claimedPost);

            const result = await service.claimPost(postId);

            expect(result).toBeDefined();
            expect(mockPrismaService.post.update).toHaveBeenCalledWith({
                where: { id: postId },
                data: {
                    meta: expect.stringContaining('processing'),
                },
                include: expect.any(Object),
            });

            const updatedMeta = JSON.parse(
                mockPrismaService.post.update.mock.calls[0][0].data.meta,
            );
            expect(updatedMeta.processing).toBe(true);
            expect(updatedMeta.claimedAt).toBeDefined();
        });

        it('should throw error when post not found', async () => {
            const postId = 'non-existent';

            mockPrismaService.post.findUnique.mockResolvedValue(null);

            await expect(service.claimPost(postId)).rejects.toThrow('Post not found');
        });

        it('should throw error when post is not scheduled', async () => {
            const postId = 'post-1';
            const mockPost = {
                id: postId,
                status: 'PUBLISHED', // Already published
                meta: '{}',
            };

            mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

            await expect(service.claimPost(postId)).rejects.toThrow(
                'Post is not scheduled',
            );
        });

        it('should throw error when post is already being processed', async () => {
            const postId = 'post-1';
            const mockPost = {
                id: postId,
                status: 'SCHEDULED',
                meta: JSON.stringify({
                    processing: true,
                    claimedAt: new Date().toISOString(),
                }),
            };

            mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

            await expect(service.claimPost(postId)).rejects.toThrow(
                'Post is already being processed',
            );
        });

        it('should preserve existing meta fields when claiming', async () => {
            const postId = 'post-1';
            const existingMeta = {
                customField: 'value',
                anotherField: 123,
            };

            const mockPost = {
                id: postId,
                status: 'SCHEDULED',
                meta: JSON.stringify(existingMeta),
            };

            mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
            mockPrismaService.post.update.mockResolvedValue({
                ...mockPost,
                meta: '{}',
            });

            await service.claimPost(postId);

            const updatedMeta = JSON.parse(
                mockPrismaService.post.update.mock.calls[0][0].data.meta,
            );
            expect(updatedMeta.customField).toBe('value');
            expect(updatedMeta.anotherField).toBe(123);
            expect(updatedMeta.processing).toBe(true);
        });
    });

    describe('updatePostStatus', () => {
        it('should update status to PUBLISHED and set publishedAt', async () => {
            const postId = 'post-1';
            const mockPost = {
                id: postId,
                status: 'SCHEDULED',
                meta: JSON.stringify({ processing: true }),
            };

            mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

            const updatedPost = {
                ...mockPost,
                status: 'PUBLISHED',
                publishedAt: expect.any(Date),
            };

            mockPrismaService.post.update.mockResolvedValue(updatedPost);

            const result = await service.updatePostStatus(
                postId,
                'PUBLISHED',
            );

            expect(result).toBeDefined();
            expect(mockPrismaService.post.update).toHaveBeenCalledWith({
                where: { id: postId },
                data: expect.objectContaining({
                    status: 'PUBLISHED',
                    publishedAt: expect.anything(),
                }),
            });
        });

        it('should remove processing flag from meta', async () => {
            const postId = 'post-1';
            const mockPost = {
                id: postId,
                status: 'SCHEDULED',
                meta: JSON.stringify({
                    processing: true,
                    claimedAt: '2025-12-29T10:00:00Z',
                }),
            };

            mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
            mockPrismaService.post.update.mockResolvedValue({ ...mockPost });

            await service.updatePostStatus(postId, 'PUBLISHED');

            const updatedMeta = JSON.parse(
                mockPrismaService.post.update.mock.calls[0][0].data.meta,
            );
            expect(updatedMeta.processing).toBeUndefined();
        });

        it('should store error message in meta when status is FAILED', async () => {
            const postId = 'post-1';
            const errorMessage = 'Network timeout';
            const mockPost = {
                id: postId,
                status: 'SCHEDULED',
                meta: JSON.stringify({ processing: true }),
            };

            mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
            mockPrismaService.post.update.mockResolvedValue({ ...mockPost });

            await service.updatePostStatus(postId, 'FAILED', errorMessage);

            const updatedMeta = JSON.parse(
                mockPrismaService.post.update.mock.calls[0][0].data.meta,
            );
            expect(updatedMeta.lastError).toBe(errorMessage);
            expect(mockPrismaService.post.update).toHaveBeenCalledWith({
                where: { id: postId },
                data: expect.objectContaining({
                    status: 'FAILED',
                }),
            });
        });

        it('should not set publishedAt when status is not PUBLISHED', async () => {
            const postId = 'post-1';
            const mockPost = {
                id: postId,
                status: 'SCHEDULED',
                meta: '{}',
            };

            mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
            mockPrismaService.post.update.mockResolvedValue({ ...mockPost });

            await service.updatePostStatus(postId, 'FAILED');

            const updateCall = mockPrismaService.post.update.mock.calls[0][0];
            expect(updateCall.data.publishedAt).toBeUndefined();
        });

        it('should preserve existing meta fields when updating status', async () => {
            const postId = 'post-1';
            const existingMeta = {
                customField: 'value',
                processing: true,
            };

            const mockPost = {
                id: postId,
                status: 'SCHEDULED',
                meta: JSON.stringify(existingMeta),
            };

            mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
            mockPrismaService.post.update.mockResolvedValue({ ...mockPost });

            await service.updatePostStatus(postId, 'PUBLISHED');

            const updatedMeta = JSON.parse(
                mockPrismaService.post.update.mock.calls[0][0].data.meta,
            );
            expect(updatedMeta.customField).toBe('value');
            expect(updatedMeta.processing).toBeUndefined(); // Should be removed
            expect(updatedMeta.updatedAt).toBeDefined();
        });

        it('should throw error when post not found', async () => {
            const postId = 'non-existent';

            mockPrismaService.post.findUnique.mockResolvedValue(null);

            await expect(
                service.updatePostStatus(postId, 'PUBLISHED'),
            ).rejects.toThrow('Post not found');
        });

        it('should handle multiple status updates correctly', async () => {
            const postId = 'post-1';
            const mockPost = {
                id: postId,
                status: 'SCHEDULED',
                meta: '{}',
            };

            // First update to FAILED
            mockPrismaService.post.findUnique.mockResolvedValueOnce(mockPost);
            mockPrismaService.post.update.mockResolvedValueOnce({ ...mockPost });

            await service.updatePostStatus(postId, 'FAILED', 'Error 1');

            let updatedMeta = JSON.parse(
                mockPrismaService.post.update.mock.calls[0][0].data.meta,
            );
            expect(updatedMeta.lastError).toBe('Error 1');

            // Second update to PUBLISHED - mock the post with updated meta from first call
            const postAfterFirstUpdate = {
                ...mockPost,
                meta: mockPrismaService.post.update.mock.calls[0][0].data.meta,
            };
            mockPrismaService.post.findUnique.mockResolvedValueOnce(postAfterFirstUpdate);
            mockPrismaService.post.update.mockResolvedValueOnce({ ...mockPost });

            await service.updatePostStatus(postId, 'PUBLISHED');

            updatedMeta = JSON.parse(
                mockPrismaService.post.update.mock.calls[1][0].data.meta,
            );
            expect(updatedMeta.lastError).toBe('Error 1'); // Should preserve previous error
        });
    });

    describe('Race condition scenarios', () => {
        it('should prevent double claiming through processing flag', async () => {
            const postId = 'post-1';
            const mockPost = {
                id: postId,
                status: 'SCHEDULED',
                meta: '{}',
            };

            // First claim
            mockPrismaService.post.findUnique.mockResolvedValueOnce(mockPost);
            mockPrismaService.post.update.mockResolvedValueOnce({
                ...mockPost,
                meta: JSON.stringify({ processing: true }),
            });

            await service.claimPost(postId);

            // Second claim attempt (simulating race condition)
            mockPrismaService.post.findUnique.mockResolvedValueOnce({
                ...mockPost,
                meta: JSON.stringify({ processing: true }),
            });

            await expect(service.claimPost(postId)).rejects.toThrow(
                'Post is already being processed',
            );
        });
    });
});
