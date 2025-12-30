import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { User } from '@prisma/client';
import { AppConfig } from '../../config/app.config.js';

/**
 * Service for managing user data.
 */
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) { }

  async findByTelegramId(telegramId: bigint): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { telegramId },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find a user by their Telegram ID or create one if they don't exist.
   * Updates profile information (username, name, avatar) on every login.
   *
   * @param userData - The user data from Telegram.
   * @returns The existing or newly created User.
   */
  async findOrCreateTelegramUser(userData: {
    telegramId: bigint;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  }): Promise<User> {
    let fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || null;

    // Fallback to username if no full name can be constructed
    if (!fullName && userData.username) {
      fullName = userData.username;
    }

    // Check if this user should be an admin based on environment variable
    const adminId = this.configService.get<AppConfig>('app')?.adminTelegramId;
    const isAdmin = adminId ? BigInt(adminId) === userData.telegramId : false;

    return this.prisma.user.upsert({
      where: { telegramId: userData.telegramId },
      update: {
        telegramUsername: userData.username,
        fullName: fullName,
        avatarUrl: userData.avatarUrl,
        // Only promote to admin if the env variable matches.
        // We don't demote here if it doesn't match, unless you want that.
        // Usually, once an admin, always an admin, but for "via env" we might want strict sync.
        ...(isAdmin ? { isAdmin: true } : {}),
      },
      create: {
        telegramId: userData.telegramId,
        telegramUsername: userData.username,
        fullName: fullName,
        avatarUrl: userData.avatarUrl,
        isAdmin: isAdmin,
      },
    });
  }

  /**
   * Find all users with pagination and filtering.
   * Returns users with their statistics (projects count, posts count).
   */
  async findAll(options: {
    page: number;
    perPage: number;
    isAdmin?: boolean;
    search?: string;
  }) {
    const { page, perPage, isAdmin, search } = options;
    const skip = (page - 1) * perPage;

    // Build where clause
    const where: any = {};

    if (isAdmin !== undefined) {
      where.isAdmin = isAdmin;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { telegramUsername: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get users with statistics
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            ownedProjects: true,
            posts: true,
          },
        },
      },
    });

    // Transform users to include statistics
    const usersWithStats = users.map(user => ({
      id: user.id,
      telegramId: user.telegramId?.toString(),
      email: user.email,
      telegram_username: user.telegramUsername,
      full_name: user.fullName,
      avatar_url: user.avatarUrl,
      is_admin: user.isAdmin,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      projectsCount: user._count.ownedProjects,
      postsCount: user._count.posts,
    }));

    return {
      data: usersWithStats,
      meta: {
        total,
        page,
        perPage,
      },
    };
  }

  /**
   * Update admin status for a user.
   */
  async updateAdminStatus(userId: string, isAdmin: boolean): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
    });
  }

  /**
   * Update user profile data.
   */
  async updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string }): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });
  }
}
