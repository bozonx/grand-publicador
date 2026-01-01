import { IsArray, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { PostStatus } from '@prisma/client';

/**
 * DTO for updating an existing publication.
 */
export class UpdatePublicationDto {
  @IsString()
  @IsOptional()
  public title?: string;

  @IsString()
  @IsOptional()
  public content?: string;

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
  public language?: string;

  @IsString()
  @IsOptional()
  public translationGroupId?: string;
}
