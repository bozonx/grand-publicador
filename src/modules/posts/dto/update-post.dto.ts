import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { PostStatus } from '@prisma/client';

/**
 * DTO for updating an existing post.
 * Posts inherit content from Publication, so only channel-specific fields can be updated.
 */
export class UpdatePostDto {
  @IsString()
  @IsOptional()
  public tags?: string; // Can override publication tags

  @IsEnum(PostStatus)
  @IsOptional()
  public status?: PostStatus;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  public scheduledAt?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  public publishedAt?: Date;
}
