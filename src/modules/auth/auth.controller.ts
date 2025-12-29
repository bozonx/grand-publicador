import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

class TelegramLoginDto {
    @IsString()
    @IsNotEmpty()
    initData!: string;
}

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('telegram')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: TelegramLoginDto) {
        return this.authService.loginWithTelegram(loginDto.initData);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.userId);
    }
}
