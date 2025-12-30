import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { PostStatus } from '@prisma/client';

/**
 * DTO for updating an existing post.
 */
export class UpdatePostDto {
  @IsString()
  @IsOptional()
  public content?: string;

  @IsString()
  @IsOptional()
  public title?: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsString()
  @IsOptional()
  public authorComment?: string;

  @IsString()
  @IsOptional()
  public tags?: string;

  @IsArray()
  @IsOptional()
  public mediaFiles?: string[];

  @IsEnum(PostStatus)
  @IsOptional()
  public status?: PostStatus;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  public postDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  public scheduledAt?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  public publishedAt?: Date;
}
