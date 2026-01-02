import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * DTO for updating an existing channel.
 */
export class UpdateChannelDto {
  @IsString()
  @IsOptional()
  public name?: string;

  @IsString()
  @IsOptional()
  public channelIdentifier?: string;

  @IsString()
  @IsOptional()
  public projectId?: string;

  @IsObject()
  @IsOptional()
  public credentials?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  public isActive?: boolean;
}
