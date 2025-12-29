
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { PostType, PostStatus } from '@prisma/client';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    channelId!: string;

    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsString()
    @IsNotEmpty()
    socialMedia!: string;

    @IsEnum(PostType)
    @IsNotEmpty()
    postType!: PostType;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    authorComment?: string;

    @IsString()
    @IsOptional()
    tags?: string;

    @IsOptional()
    mediaFiles?: any;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    scheduledAt?: Date;

    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus;
}
