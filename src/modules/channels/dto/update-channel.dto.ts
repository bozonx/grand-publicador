
import { IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class UpdateChannelDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    channelIdentifier?: string;

    @IsObject()
    @IsOptional()
    credentials?: Record<string, any>;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
