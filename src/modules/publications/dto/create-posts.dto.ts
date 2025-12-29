import {
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsDate,
  ArrayMinSize,
  ArrayUnique,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating posts from a publication.
 * Specifies target channels and optional scheduling.
 */
export class CreatePostsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one channel must be specified' })
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  channelIds!: string[];

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  scheduledAt?: Date;
}
