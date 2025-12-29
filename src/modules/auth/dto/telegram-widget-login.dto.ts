import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * DTO for Telegram Login Widget authentication request.
 */
export class TelegramWidgetLoginDto {
    @IsNumber()
    @IsNotEmpty()
    id!: number;

    @IsString()
    @IsNotEmpty()
    first_name!: string;

    @IsString()
    @IsOptional()
    last_name?: string;

    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    photo_url?: string;

    @IsNumber()
    @IsNotEmpty()
    auth_date!: number;

    @IsString()
    @IsNotEmpty()
    hash!: string;
}
