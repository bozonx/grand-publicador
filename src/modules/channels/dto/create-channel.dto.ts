import { IsNotEmpty, IsOptional, IsString, IsEnum, IsObject } from 'class-validator';
import { SocialMedia } from '@prisma/client';

/**
 * DTO for creating a new social media channel.
 */
export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsEnum(SocialMedia)
  @IsNotEmpty()
  socialMedia!: SocialMedia;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  channelIdentifier!: string;

  @IsObject()
  @IsOptional()
  credentials?: Record<string, any>;
}
