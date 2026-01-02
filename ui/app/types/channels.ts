import type { SocialMedia } from './socialMedia'

export interface Channel {
    id: string
    projectId: string
    socialMedia: SocialMedia
    name: string
    channelIdentifier: string
    language: string
    credentials?: Record<string, any>
    isActive: boolean
    archivedAt?: string | null
    createdAt: string
    updatedAt: string
}

export interface ChannelWithProject extends Channel {
    project?: {
        id: string
        name: string
    } | null
    role?: string
    postsCount?: number
    lastPostAt?: string
    lastPostId?: string | null
}

export interface ChannelCreateInput {
    projectId: string
    name: string
    socialMedia: SocialMedia
    channelIdentifier: string
    language: string
    isActive?: boolean
    credentials?: Record<string, any>
}

export interface ChannelUpdateInput {
    name?: string
    channelIdentifier?: string
    projectId?: string
    credentials?: Record<string, any>
    isActive?: boolean
}

export interface ChannelsFilter {
    projectId?: string
    socialMedia?: SocialMedia | null
    isActive?: boolean | null
    search?: string
    includeArchived?: boolean
}
