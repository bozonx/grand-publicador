import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { IsNotEmpty, IsString } from 'class-validator';

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
}
