
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { UsersService } from '../users/users.service.js';
import { plainToInstance } from 'class-transformer';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { UserDto } from '../users/dto/user.dto.js';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

@Injectable()
export class AuthService {
    private readonly botToken: string;
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        this.botToken = this.configService.get<string>('AUTH_TELEGRAM_BOT_TOKEN') ?? this.configService.get<string>('TELEGRAM_BOT_TOKEN')!;
        if (!this.botToken) {
            throw new Error('AUTH_TELEGRAM_BOT_TOKEN is not defined in config');
        }
    }

    async loginWithTelegram(initData: string): Promise<AuthResponseDto> {
        const isValid = this.validateTelegramInitData(initData);
        if (!isValid) {
            this.logger.warn('Invalid Telegram init data');
            throw new UnauthorizedException('Invalid Telegram init data');
        }

        const searchParams = new URLSearchParams(initData);
        const userStr = searchParams.get('user');
        if (!userStr) {
            throw new UnauthorizedException('User data missing in Telegram init data');
        }

        const tgUser = JSON.parse(userStr) as TelegramUser;
        const user = await this.usersService.findOrCreateTelegramUser({
            telegramId: BigInt(tgUser.id),
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            avatarUrl: tgUser.photo_url,
        });

        const payload = {
            sub: user.id,
            telegramId: user.telegramId?.toString(),
            username: user.username
        };

        return plainToInstance(AuthResponseDto, {
            access_token: this.jwtService.sign(payload),
            user: user,
        }, { excludeExtraneousValues: true });
    }

    private validateTelegramInitData(initData: string): boolean {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        const params = Array.from(urlParams.entries())
            .map(([key, value]) => `${key}=${value}`)
            .sort()
            .join('\n');

        const secretKey = createHmac('sha256', 'WebAppData').update(this.botToken).digest();
        const calculatedHash = createHmac('sha256', secretKey).update(params).digest('hex');

        return calculatedHash === hash;
    }

    async getProfile(userId: string): Promise<UserDto> {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
    }
}
