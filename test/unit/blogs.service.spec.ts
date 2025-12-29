import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BlogsService } from '../../src/modules/blogs/blogs.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';
import { jest } from '@jest/globals';

describe('BlogsService (unit)', () => {
  let service: BlogsService;
  let prisma: PrismaService;
  let moduleRef: TestingModule;

  const mockPrismaService = {
    $transaction: jest.fn(),
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        BlogsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = moduleRef.get<BlogsService>(BlogsService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create project and add owner as member in transaction', async () => {
      const userId = 'user-1';
      const createData = {
        name: 'Test Project',
        description: 'Test Description',
      };

      const mockProject = {
        id: 'project-1',
        ...createData,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock transaction
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          project: {
            create: jest.fn().mockResolvedValue(mockProject),
          },
          projectMember: {
            create: jest.fn().mockResolvedValue({
              id: 'member-1',
              projectId: mockProject.id,
              userId,
              role: 'OWNER',
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.create(userId, createData);

      expect(result).toEqual(mockProject);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('findAllForUser', () => {
    it('should return all projects where user is a member', async () => {
      const userId = 'user-1';
      const mockProjects = [
        { id: 'project-1', name: 'Project 1' },
        { id: 'project-2', name: 'Project 2' },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await service.findAllForUser(userId);

      expect(result).toEqual(mockProjects);
    });
  });

  describe('findOne', () => {
    it('should return project with role when user is member', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';

      const mockMembership = {
        projectId,
        userId,
        role: 'EDITOR',
      };

      const mockProject = {
        id: projectId,
        name: 'Test Project',
        channels: [],
        members: [],
      };

      mockPrismaService.projectMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.findOne(projectId, userId);

      expect(result).toEqual({ ...mockProject, role: 'EDITOR' });
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';

      mockPrismaService.projectMember.findUnique.mockResolvedValue(null);

      await expect(service.findOne(projectId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should allow OWNER to update project', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';
      const updateData = { name: 'Updated Name' };

      mockPrismaService.projectMember.findUnique.mockResolvedValue({
        projectId,
        userId,
        role: 'OWNER',
      });

      const updatedProject = {
        id: projectId,
        ...updateData,
      };

      mockPrismaService.project.update.mockResolvedValue(updatedProject);

      const result = await service.update(projectId, userId, updateData);

      expect(result).toEqual(updatedProject);
    });

    it('should throw ForbiddenException when EDITOR tries to update', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';
      const updateData = { name: 'Hacked' };

      mockPrismaService.projectMember.findUnique.mockResolvedValue({
        projectId,
        userId,
        role: 'EDITOR',
      });

      await expect(
        service.update(projectId, userId, updateData),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should allow only OWNER to delete project', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';

      mockPrismaService.projectMember.findUnique.mockResolvedValue({
        projectId,
        userId,
        role: 'OWNER',
      });

      mockPrismaService.project.delete.mockResolvedValue({
        id: projectId,
      });

      await expect(service.remove(projectId, userId)).resolves.toBeDefined();
    });

    it('should throw ForbiddenException when ADMIN tries to delete', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';

      mockPrismaService.projectMember.findUnique.mockResolvedValue({
        projectId,
        userId,
        role: 'ADMIN',
      });

      await expect(service.remove(projectId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
