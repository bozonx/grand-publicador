import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { PostStatus } from '@prisma/client';

/**
 * DTO for creating a new publication.
 */
export class CreatePublicationDto {
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

  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;

  @IsString()
  @IsOptional()
  authorId?: string;
}
