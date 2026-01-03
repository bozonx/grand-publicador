import type { SocialMedia } from './socialMedia'

export interface Channel {
    id: string
    projectId: string
    socialMedia: SocialMedia
    name: string
    description?: string | null
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
    lastPublicationId?: string | null
}

export interface ChannelCreateInput {
    projectId: string
    name: string
    description?: string
    socialMedia: SocialMedia
    channelIdentifier: string
    language: string
    isActive?: boolean
    credentials?: Record<string, any>
}

export interface ChannelUpdateInput {
    name?: string
    description?: string
    channelIdentifier?: string
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
