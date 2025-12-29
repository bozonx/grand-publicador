import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { PostStatus } from '@prisma/client';

export class CreateExternalPublicationDto {
    @IsString()
    @IsNotEmpty()
    projectId!: string;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsArray()
    @IsOptional()
    mediaFiles?: string[];

    @IsString()
    @IsOptional()
    tags?: string;

    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus;
}

export class SchedulePublicationDto {
    @IsArray()
    @IsNotEmpty()
    channelIds!: string[];

    @IsDateString()
    @IsOptional()
    scheduledAt?: Date;
}
