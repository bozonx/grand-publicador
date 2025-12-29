
import { IsNotEmpty, IsArray, IsOptional, IsDate, ArrayMinSize, ArrayUnique, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

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
