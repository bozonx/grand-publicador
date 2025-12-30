import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { SocialMedia } from '@prisma/client';

/**
 * DTO for creating a new social media channel.
 */
export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  public projectId!: string;

  @IsEnum(SocialMedia)
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  public socialMedia!: SocialMedia;

  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsString()
  @IsNotEmpty()
  public channelIdentifier!: string;

  @IsObject()
  @IsOptional()
  public credentials?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  public isActive?: boolean;
}
