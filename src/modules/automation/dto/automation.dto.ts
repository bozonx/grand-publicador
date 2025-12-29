import { IsEnum, IsOptional } from 'class-validator';
import { PostStatus } from '@prisma/client';

/**
 * DTO for updating the status of a post after an automation attempt.
 */
export class UpdatePostStatusDto {
  @IsEnum(PostStatus)
  status!: PostStatus;

  @IsOptional()
  error?: string;
}
