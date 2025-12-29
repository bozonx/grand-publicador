import {
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
    IsObject,
} from 'class-validator';
import { PostStatus } from '@prisma/client';

export class UpdatePublicationDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsArray()
    @IsOptional()
    mediaFiles?: string[];

    @IsString()
    @IsOptional()
    tags?: string;

    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus;

    @IsObject()
    @IsOptional()
    meta?: Record<string, any>;
}
