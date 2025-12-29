import { IsEnum, IsOptional } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class UpdatePostStatusDto {
    @IsEnum(PostStatus)
    status!: PostStatus;

    @IsOptional()
    error?: string;
}
