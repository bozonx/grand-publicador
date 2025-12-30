import type { Tables } from './database.types';

export enum ArchiveEntityType {
    PROJECT = 'project',
    CHANNEL = 'channel',
    PUBLICATION = 'publication',
    POST = 'post',
}

export interface ArchiveStats {
    projects: number;
    channels: number;
    publications: number;
    posts: number;
    total: number;
}

export interface MoveEntityDto {
    targetParentId: string;
}

export type ArchivedProject = Tables<'projects'>;
export type ArchivedChannel = Tables<'channels'>;
export type ArchivedPublication = Tables<'publications'>;
export type ArchivedPost = Tables<'posts'>;

export type ArchivedEntity = ArchivedProject | ArchivedChannel | ArchivedPublication | ArchivedPost;
