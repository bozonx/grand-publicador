import { IsEnum, IsOptional } from 'class-validator';
import { PostStatus } from '@prisma/client';

/**
 * DTO for updating the status of a post after an automation attempt.
 */
export class UpdatePostStatusDto {
  @IsEnum(PostStatus)
  public status!: PostStatus;

  @IsOptional()
  public error?: string;
}
