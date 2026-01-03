import { IsArray, IsDate, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus, PostType } from '../../../generated/prisma/client.js';

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
  @IsOptional()
  public description?: string;

  @IsString()
  @IsNotEmpty()
  public content!: string;

  @IsString()
  @IsOptional()
  public authorComment?: string;

  @IsArray()
  @IsOptional()
  public mediaFiles?: string[];

  @IsString()
  @IsOptional()
  public tags?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  public postDate?: Date;

  @IsEnum(PostStatus)
  @IsOptional()
  public status?: PostStatus;

  @IsObject()
  @IsOptional()
  public meta?: Record<string, any>;

  @IsString()
  @IsOptional()
  public createdBy?: string;

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
