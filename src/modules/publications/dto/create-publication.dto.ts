import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { PostStatus, PostType } from '@prisma/client';

/**
 * DTO for creating a new publication.
 */
export class CreatePublicationDto {
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

  @IsObject()
  @IsOptional()
  public meta?: Record<string, any>;

  @IsString()
  @IsOptional()
  public authorId?: string;

  @IsString()
  @IsNotEmpty()
  public language!: string;

  @IsString()
  @IsOptional()
  public translationGroupId?: string;

  @IsEnum(PostType)
  @IsOptional()
  public postType?: PostType;

  @IsString()
  @IsOptional()
  public linkToPublicationId?: string;
}
