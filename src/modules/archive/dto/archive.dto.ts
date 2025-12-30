import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ArchiveEntityType {
    PROJECT = 'project',
    CHANNEL = 'channel',
    PUBLICATION = 'publication',
    POST = 'post',
}

export class MoveEntityDto {
    @IsUUID()
    @IsNotEmpty()
    targetParentId!: string;
}

export class ArchiveStatsDto {
    projects!: number;
    channels!: number;
    publications!: number;
    posts!: number;
    total!: number;
}
