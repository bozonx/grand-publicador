
import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { TelegramLoginDto } from './dto/index.js';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedRequest } from '../../common/types/authenticated-request.interface.js';
import { JWT_STRATEGY } from '../../common/constants/auth.constants.js';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('telegram')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: TelegramLoginDto) {
        return this.authService.loginWithTelegram(loginDto.initData);
    }

    @UseGuards(AuthGuard(JWT_STRATEGY))
    @Get('me')
    async getProfile(@Request() req: AuthenticatedRequest) {
        return this.authService.getProfile(req.user.sub);
    }
}
