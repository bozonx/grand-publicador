import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PostStatus, PostType } from '@prisma/client';

/**
 * DTO for creating a new post.
 */
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  public channelId!: string;

  @IsString()
  @IsOptional()
  public publicationId?: string;

  @IsString()
  @IsOptional()
  public content?: string;

  @IsString()
  @IsOptional()
  public socialMedia?: string;

  @IsEnum(PostType)
  @IsNotEmpty()
  public postType!: PostType;

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

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  public postDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  public scheduledAt?: Date;

  @IsEnum(PostStatus)
  @IsOptional()
  public status?: PostStatus;

  @IsString()
  @IsOptional()
  public language?: string;

  @IsString()
  @IsOptional()
  public meta?: string;
}
