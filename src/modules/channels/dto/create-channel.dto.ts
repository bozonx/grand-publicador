import { IsNotEmpty, IsOptional, IsString, IsEnum, IsObject, IsBoolean } from 'class-validator';
import { SocialMedia } from '@prisma/client';
import { Transform } from 'class-transformer';

/**
 * DTO for creating a new social media channel.
 */
export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsEnum(SocialMedia)
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

