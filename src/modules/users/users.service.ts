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
    const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || null;

    // Check if this user should be an admin based on environment variable
    const adminId = this.configService.get<AppConfig>('app')?.adminTelegramId;
    const isAdmin = adminId ? BigInt(adminId) === userData.telegramId : false;

    return this.prisma.user.upsert({
      where: { telegramId: userData.telegramId },
      update: {
        username: userData.username,
        fullName: fullName,
        avatarUrl: userData.avatarUrl,
        // Only promote to admin if the env variable matches.
        // We don't demote here if it doesn't match, unless you want that.
        // Usually, once an admin, always an admin, but for "via env" we might want strict sync.
        ...(isAdmin ? { isAdmin: true } : {}),
      },
      create: {
        telegramId: userData.telegramId,
        username: userData.username,
        fullName: fullName,
        avatarUrl: userData.avatarUrl,
        isAdmin: isAdmin,
      },
    });
  }
}
