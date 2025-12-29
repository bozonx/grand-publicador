import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { PostStatus } from '@prisma/client';

/**
 * DTO for creating a publication via external API.
 */
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

/**
 * DTO for scheduling a publication via external API.
 */
export class SchedulePublicationDto {
    @IsString()
    @IsNotEmpty()
    publicationId!: string;

    @IsArray()
    @IsNotEmpty()
    channelIds!: string[];

    @IsDateString()
    @IsOptional()
    scheduledAt?: Date;
}
