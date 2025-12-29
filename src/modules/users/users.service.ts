import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { User } from '@prisma/client';

/**
 * Service for managing user data.
 */
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.user.upsert({
      where: { telegramId: userData.telegramId },
      update: {
        username: userData.username,
        fullName: fullName,
        avatarUrl: userData.avatarUrl,
      },
      create: {
        telegramId: userData.telegramId,
        username: userData.username,
        fullName: fullName,
        avatarUrl: userData.avatarUrl,
      },
    });
  }
}
