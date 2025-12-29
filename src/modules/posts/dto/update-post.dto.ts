import { IsOptional, IsString, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '@prisma/client';

/**
 * DTO for updating an existing post.
 */
export class UpdatePostDto {
  @IsString()
  @IsOptional()
  content?: string;

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

  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  postDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  scheduledAt?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  publishedAt?: Date;
}
