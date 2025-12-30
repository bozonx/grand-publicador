import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PostStatus } from '@prisma/client';

/**
 * DTO for creating a publication via external API.
 */
export class CreateExternalPublicationDto {
  @IsString()
  @IsNotEmpty()
  public projectId!: string;

  @IsString()
  @IsOptional()
  public title?: string;

  @IsString()
  @IsNotEmpty()
  public content!: string;

  @IsArray()
  @IsOptional()
  public mediaFiles?: string[];

  @IsString()
  @IsOptional()
  public tags?: string;

  @IsEnum(PostStatus)
  @IsOptional()
  public status?: PostStatus;
}

/**
 * DTO for scheduling a publication via external API.
 */
export class SchedulePublicationDto {
  @IsString()
  @IsNotEmpty()
  public publicationId!: string;

  @IsArray()
  @IsNotEmpty()
  public channelIds!: string[];

  @IsDateString()
  @IsOptional()
  public scheduledAt?: Date;
}
