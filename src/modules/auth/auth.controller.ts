import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { TelegramLoginDto } from './dto/index.js';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.interface.js';
import { JWT_STRATEGY } from '../../common/constants/auth.constants.js';

/**
 * Controller handling authentication endpoints.
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  /**
   * Log in using Telegram Mini App init data.
   * Returns a JWT token upon successful validation.
   */
  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: TelegramLoginDto) {
    return this.authService.loginWithTelegram(loginDto.initData);
  }

  /**
   * Get the authenticated user's profile.
   * Requires a valid JWT token.
   */
  @UseGuards(AuthGuard(JWT_STRATEGY))
  @Get('me')
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.sub);
  }

  /**
   * Dev login endpoint.
   */
  @Post('dev')
  @HttpCode(HttpStatus.OK)
  async loginDev(@Body() body: { telegramId: number }) {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Dev login not allowed in production');
    }
    return this.authService.loginDev(body.telegramId);
  }
}
