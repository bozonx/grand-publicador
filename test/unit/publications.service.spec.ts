import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PublicationsService } from '../../src/modules/publications/publications.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';
import { PermissionsService } from '../../src/common/services/permissions.service.js';
import { jest } from '@jest/globals';

describe('PublicationsService (unit)', () => {
  let service: PublicationsService;
  let prisma: PrismaService;
  let permissions: PermissionsService;
  let moduleRef: TestingModule;

  const mockPrismaService = {
    publication: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectMember: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    channel: {
      findMany: jest.fn(),
    },
    post: {
      create: jest.fn(),
    },
  };

  const mockPermissionsService = {
    checkProjectAccess: jest.fn(),
    checkProjectPermission: jest.fn(),
    getUserProjectRole: jest.fn(),
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        PublicationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    service = moduleRef.get<PublicationsService>(PublicationsService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
    permissions = moduleRef.get<PermissionsService>(PermissionsService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a publication when user has access to project', async () => {
      const userId = 'user-1';
      const projectId = 'project-1';
      const createDto = {
        projectId,
        title: 'Test Publication',
        content: 'Test content',
        mediaFiles: ['image1.jpg'],
        tags: 'test,demo',
        status: 'DRAFT' as any,
      };

      // Mock user has access to project
      mockPermissionsService.checkProjectAccess.mockResolvedValue(undefined);

      const expectedPublication = {
        id: 'pub-1',
        ...createDto,
        authorId: userId,
        mediaFiles: JSON.stringify(createDto.mediaFiles),
        meta: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.publication.create.mockResolvedValue(expectedPublication);

      const result = await service.create(createDto, userId);

      expect(result).toEqual(expectedPublication);
      expect(mockPermissionsService.checkProjectAccess).toHaveBeenCalledWith(projectId, userId);
      expect(mockPrismaService.publication.create).toHaveBeenCalledWith({
        data: {
          projectId,
          authorId: userId,
          title: createDto.title,
          content: createDto.content,
          mediaFiles: JSON.stringify(createDto.mediaFiles),
          tags: createDto.tags,
          status: 'DRAFT',
          meta: '{}',
        },
      });
    });

    it('should throw ForbiddenException when user does not have access', async () => {
      const userId = 'user-1';
      const createDto = {
        projectId: 'project-1',
        content: 'Test content',
      };

      // Mock access denied
      mockPermissionsService.checkProjectAccess.mockRejectedValue(
        new ForbiddenException('You do not have access to this project'),
      );

      await expect(service.create(createDto as any, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return publications with filters', async () => {
      const userId = 'user-1';
      const projectId = 'project-1';

      mockPermissionsService.checkProjectAccess.mockResolvedValue(undefined);

      const mockPublications = [
        { id: 'pub-1', status: 'DRAFT' },
        { id: 'pub-2', status: 'DRAFT' },
      ];

      mockPrismaService.publication.findMany.mockResolvedValue(mockPublications);

      const result = await service.findAll(projectId, userId, {
        status: 'DRAFT' as any,
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual(mockPublications);
      expect(mockPermissionsService.checkProjectAccess).toHaveBeenCalledWith(projectId, userId);
      expect(mockPrismaService.publication.findMany).toHaveBeenCalledWith({
        where: { projectId, status: 'DRAFT' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('update', () => {
    it('should allow author to update their publication', async () => {
      const userId = 'user-1';
      const publicationId = 'pub-1';
      const updateDto = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const mockPublication = {
        id: publicationId,
        projectId: 'project-1',
        authorId: userId, // Same as requesting user
        title: 'Old Title',
        content: 'Old content',
      };

      mockPrismaService.publication.findUnique.mockResolvedValue(mockPublication);
      mockPermissionsService.checkProjectAccess.mockResolvedValue(undefined);

      const updatedPublication = { ...mockPublication, ...updateDto };
      mockPrismaService.publication.update.mockResolvedValue(updatedPublication);

      const result = await service.update(publicationId, userId, updateDto);

      expect(result).toEqual(updatedPublication);
      expect(mockPrismaService.publication.update).toHaveBeenCalled();
    });

    it('should allow admin to update others publication', async () => {
      const userId = 'admin-user';
      const publicationId = 'pub-1';
      const updateDto = { title: 'Updated by Admin' };

      const mockPublication = {
        id: publicationId,
        projectId: 'project-1',
        authorId: 'other-user', // Different from requesting user
      };

      mockPrismaService.publication.findUnique.mockResolvedValue(mockPublication);
      mockPermissionsService.checkProjectAccess.mockResolvedValue(undefined);
      mockPermissionsService.checkProjectPermission.mockResolvedValue(undefined);

      mockPrismaService.publication.update.mockResolvedValue({
        ...mockPublication,
        ...updateDto,
      });

      await expect(service.update(publicationId, userId, updateDto)).resolves.toBeDefined();
    });

    it('should throw ForbiddenException when non-admin tries to update others publication', async () => {
      const userId = 'user-1';
      const publicationId = 'pub-1';
      const updateDto = { title: 'Hacked' };

      const mockPublication = {
        id: publicationId,
        projectId: 'project-1',
        authorId: 'other-user', // Different author
      };

      mockPrismaService.publication.findUnique.mockResolvedValue(mockPublication);
      mockPermissionsService.checkProjectAccess.mockResolvedValue(undefined);
      mockPermissionsService.checkProjectPermission.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(service.update(publicationId, userId, updateDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createPostsFromPublication', () => {
    it('should create posts for all specified channels', async () => {
      const userId = 'user-1';
      const publicationId = 'pub-1';
      const channelIds = ['channel-1', 'channel-2'];
      const scheduledAt = new Date('2025-12-30T15:00:00Z');

      const mockPublication = {
        id: publicationId,
        projectId: 'project-1',
        title: 'Test Publication',
        content: 'Test content',
        tags: 'test',
        mediaFiles: '["image1.jpg"]',
        meta: '{}',
      };

      const mockChannels = [
        {
          id: 'channel-1',
          projectId: 'project-1',
          socialMedia: 'TELEGRAM',
        },
        {
          id: 'channel-2',
          projectId: 'project-1',
          socialMedia: 'INSTAGRAM',
        },
      ];

      mockPrismaService.publication.findUnique.mockResolvedValue(mockPublication);
      mockPermissionsService.checkProjectAccess.mockResolvedValue(undefined);
      mockPrismaService.channel.findMany.mockResolvedValue(mockChannels);

      const mockPosts = mockChannels.map(channel => ({
        id: `post-${channel.id}`,
        publicationId,
        channelId: channel.id,
        content: mockPublication.content,
        status: 'SCHEDULED',
        scheduledAt,
      }));

      mockPrismaService.post.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: `post-${data.channelId}`, ...data }),
      );

      const result = await service.createPostsFromPublication(
        publicationId,
        channelIds,
        userId,
        scheduledAt,
      );

      expect(result).toHaveLength(2);
      expect(mockPrismaService.post.create).toHaveBeenCalledTimes(2);
      expect(result[0].status).toBe('SCHEDULED');
      expect(result[0].scheduledAt).toEqual(scheduledAt);
    });

    it('should throw NotFoundException when some channels do not belong to project', async () => {
      const userId = 'user-1';
      const publicationId = 'pub-1';
      const channelIds = ['channel-1', 'channel-2', 'channel-3'];

      const mockPublication = {
        id: publicationId,
        projectId: 'project-1',
      };

      // Only 2 channels found, but 3 requested
      const mockChannels = [
        { id: 'channel-1', projectId: 'project-1' },
        { id: 'channel-2', projectId: 'project-1' },
      ];

      mockPrismaService.publication.findUnique.mockResolvedValue(mockPublication);
      mockPermissionsService.checkProjectAccess.mockResolvedValue(undefined);
      mockPrismaService.channel.findMany.mockResolvedValue(mockChannels);

      await expect(
        service.createPostsFromPublication(publicationId, channelIds, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create posts as DRAFT when no scheduledAt provided', async () => {
      const userId = 'user-1';
      const publicationId = 'pub-1';
      const channelIds = ['channel-1'];

      const mockPublication = {
        id: publicationId,
        projectId: 'project-1',
        content: 'Test',
      };

      const mockChannels = [{ id: 'channel-1', projectId: 'project-1', socialMedia: 'TELEGRAM' }];

      mockPrismaService.publication.findUnique.mockResolvedValue(mockPublication);
      mockPermissionsService.checkProjectAccess.mockResolvedValue(undefined);
      mockPrismaService.channel.findMany.mockResolvedValue(mockChannels);

      mockPrismaService.post.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'post-1', ...data }),
      );

      const result = await service.createPostsFromPublication(publicationId, channelIds, userId);

      expect(result[0].status).toBe('DRAFT');
      expect(result[0].scheduledAt).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should allow author to delete their publication', async () => {
      const userId = 'user-1';
      const publicationId = 'pub-1';

      const mockPublication = {
        id: publicationId,
        projectId: 'project-1',
        authorId: userId,
      };

      mockPrismaService.publication.findUnique.mockResolvedValue(mockPublication);
      mockPermissionsService.checkProjectAccess.mockResolvedValue(undefined);

      mockPrismaService.publication.delete.mockResolvedValue(mockPublication);

      await expect(service.remove(publicationId, userId)).resolves.toBeDefined();
      expect(mockPrismaService.publication.delete).toHaveBeenCalledWith({
        where: { id: publicationId },
      });
    });

    it('should throw ForbiddenException when non-admin tries to delete others publication', async () => {
      const userId = 'user-1';
      const publicationId = 'pub-1';

      const mockPublication = {
        id: publicationId,
        projectId: 'project-1',
        authorId: 'other-user',
      };

      mockPrismaService.publication.findUnique.mockResolvedValue(mockPublication);
      mockPermissionsService.checkProjectAccess.mockResolvedValue(undefined);
      mockPermissionsService.checkProjectPermission.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(service.remove(publicationId, userId)).rejects.toThrow(ForbiddenException);
    });
  });
});
