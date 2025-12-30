import { Test, type TestingModule } from '@nestjs/testing';
import { AutomationService } from '../../src/modules/automation/automation.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';
import { jest } from '@jest/globals';
import { PostStatus } from '@prisma/client';

describe('AutomationService (unit)', () => {
  let service: AutomationService;
  let moduleRef: TestingModule;

  const mockPrismaService = {
    $transaction: jest.fn((callback: (tx: any) => Promise<any>, _options?: any) =>
      callback(mockPrismaService),
    ) as any,
    post: {
      findMany: jest.fn() as any,
      findUnique: jest.fn() as any,
      update: jest.fn() as any,
      updateMany: (jest.fn() as any).mockResolvedValue({ count: 1 }),
    },
    projectMember: {
      findMany: jest.fn() as any,
      findUnique: jest.fn() as any,
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
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaService.$transaction.mockImplementation((callback: (tx: any) => any) =>
      callback(mockPrismaService),
    );
  });

  describe('getPendingPosts', () => {
    it('should return posts and handle filtering', async () => {
      const now = new Date('2025-12-29T10:00:00Z');
      const OriginalDate = global.Date;
      jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
        if (args.length) return new OriginalDate(...(args as [any]));
        return now;
      });

      const userId = 'user-1';
      const projectId = 'project-1';

      mockPrismaService.projectMember.findMany.mockResolvedValue([{ projectId }]);
      mockPrismaService.post.findMany.mockResolvedValue([]);

      await service.getPendingPosts(10, 60, userId, []);

      expect(mockPrismaService.projectMember.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { projectId: true },
      });

      expect(mockPrismaService.post.updateMany).toHaveBeenCalled();
      expect(mockPrismaService.post.findMany).toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it('should respect scopeProjectIds', async () => {
      const userId = 'user-1';
      mockPrismaService.projectMember.findMany.mockResolvedValue([{ projectId: 'p1' }, { projectId: 'p2' }]);
      mockPrismaService.post.findMany.mockResolvedValue([]);

      await service.getPendingPosts(10, 60, userId, ['p1']);

      const findManyCall = mockPrismaService.post.findMany.mock.calls[0][0];
      expect(findManyCall.where.channel.projectId.in).toEqual(['p1']);
    });
  });

  describe('claimPost', () => {
    it('should successfully claim a scheduled post', async () => {
      const postId = 'post-1';
      const userId = 'user-1';
      const projectId = 'project-1';

      const mockPost = {
        id: postId,
        status: PostStatus.SCHEDULED,
        meta: '{}',
        channel: { projectId },
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.projectMember.findUnique.mockResolvedValue({ projectId, userId });
      mockPrismaService.post.update.mockResolvedValue({ ...mockPost, meta: '{"processing":true}' });

      const result = await service.claimPost(postId, userId, []);

      expect(result).toBeDefined();
      expect(mockPrismaService.post.update).toHaveBeenCalled();
      const updateCall = mockPrismaService.post.update.mock.calls[0][0];
      expect(JSON.parse(updateCall.data.meta)).toMatchObject({
        processing: true,
        claimedBy: userId,
      });
    });

    it('should throw error when post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);
      await expect(service.claimPost('id', 'u', [])).rejects.toThrow('Post not found');
    });

    it('should throw ForbiddenException if user not member', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ channel: { projectId: 'p1' } });
      mockPrismaService.projectMember.findUnique.mockResolvedValue(null);
      await expect(service.claimPost('id', 'u', [])).rejects.toThrow('Access denied');
    });

    it('should throw ConflictException if already processing', async () => {
      const mockPost = {
        status: PostStatus.SCHEDULED,
        meta: '{"processing":true}',
        channel: { projectId: 'p1' },
      };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.projectMember.findUnique.mockResolvedValue({ projectId: 'p1' });
      await expect(service.claimPost('id', 'u', [])).rejects.toThrow('Post is already being processed');
    });
  });

  describe('updatePostStatus', () => {
    it('should update status to PUBLISHED and remove processing flag', async () => {
      const postId = 'post-1';
      const userId = 'user-1';
      const projectId = 'project-1';

      const mockPost = {
        id: postId,
        status: PostStatus.SCHEDULED,
        meta: '{"processing":true,"other":"data"}',
        channel: { projectId },
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.projectMember.findUnique.mockResolvedValue({ projectId, userId });
      mockPrismaService.post.update.mockResolvedValue({ ...mockPost, status: PostStatus.PUBLISHED });

      const result = await service.updatePostStatus(postId, PostStatus.PUBLISHED, userId, []);

      expect(result).toBeDefined();
      const updateCall = mockPrismaService.post.update.mock.calls[0][0];
      const meta = JSON.parse(updateCall.data.meta);
      expect(meta.processing).toBeUndefined();
      expect(meta.other).toBe('data');
      expect(updateCall.data.status).toBe(PostStatus.PUBLISHED);
      expect(updateCall.data.publishedAt).toBeDefined();
    });

    it('should include error message in meta if provided', async () => {
      const mockPost = { meta: '{}', channel: { projectId: 'p1' } };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.projectMember.findUnique.mockResolvedValue({ projectId: 'p1' });

      await service.updatePostStatus('id', PostStatus.FAILED, 'u', [], 'Some error');

      const updateCall = mockPrismaService.post.update.mock.calls[0][0];
      expect(JSON.parse(updateCall.data.meta).lastError).toBe('Some error');
    });
  });
});
