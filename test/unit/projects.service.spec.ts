import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { ProjectsService } from '../../src/modules/projects/projects.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';
import { PermissionsService } from '../../src/common/services/permissions.service.js';
import { jest } from '@jest/globals';

describe('ProjectsService (unit)', () => {
  let service: ProjectsService;
  let prisma: PrismaService;
  let permissions: PermissionsService;
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

  const mockPermissionsService = {
    checkProjectAccess: jest.fn(),
    checkProjectPermission: jest.fn(),
    getUserProjectRole: jest.fn(),
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
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

    service = moduleRef.get<ProjectsService>(ProjectsService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
    permissions = moduleRef.get<PermissionsService>(PermissionsService);

    // Silence logger for tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
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

      const mockProject = {
        id: projectId,
        name: 'Test Project',
        channels: [],
        members: [],
      };

      mockPermissionsService.getUserProjectRole.mockResolvedValue('EDITOR');
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.findOne(projectId, userId);

      expect(result).toEqual({ ...mockProject, role: 'EDITOR' });
    });

    it('should throw ForbiddenException when user has no role', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';

      mockPermissionsService.getUserProjectRole.mockResolvedValue(null);

      await expect(service.findOne(projectId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should allow OWNER to update project', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';
      const updateData = { name: 'Updated Name' };

      mockPermissionsService.checkProjectPermission.mockResolvedValue(undefined);

      const updatedProject = {
        id: projectId,
        ...updateData,
      };

      mockPrismaService.project.update.mockResolvedValue(updatedProject);

      const result = await service.update(projectId, userId, updateData);

      expect(result).toEqual(updatedProject);
      expect(mockPermissionsService.checkProjectPermission).toHaveBeenCalledWith(
        projectId,
        userId,
        ['OWNER', 'ADMIN'],
      );
    });

    it('should throw ForbiddenException when EDITOR tries to update', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';
      const updateData = { name: 'Hacked' };

      mockPermissionsService.checkProjectPermission.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(service.update(projectId, userId, updateData)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should allow only OWNER to delete project', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';

      mockPermissionsService.checkProjectPermission.mockResolvedValue(undefined);

      mockPrismaService.project.delete.mockResolvedValue({
        id: projectId,
      });

      await expect(service.remove(projectId, userId)).resolves.toBeDefined();
      expect(mockPermissionsService.checkProjectPermission).toHaveBeenCalledWith(
        projectId,
        userId,
        ['OWNER'],
      );
    });

    it('should throw ForbiddenException when ADMIN tries to delete', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';

      mockPermissionsService.checkProjectPermission.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(service.remove(projectId, userId)).rejects.toThrow(ForbiddenException);
    });
  });
});
