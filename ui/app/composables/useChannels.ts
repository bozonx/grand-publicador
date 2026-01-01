import { ref, computed } from 'vue'

export type SocialMedia = 'TELEGRAM' | 'INSTAGRAM' | 'VK' | 'YOUTUBE' | 'TIKTOK' | 'X' | 'FACEBOOK' | 'LINKEDIN' | 'SITE'

export interface Channel {
    id: string
    projectId: string
    socialMedia: SocialMedia
    name: string
    channelIdentifier: string
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
    postsCount?: number
    lastPostAt?: string
}

export interface ChannelCreateInput {
    projectId: string
    name: string
    socialMedia: SocialMedia
    channelIdentifier: string
    isActive?: boolean
    credentials?: Record<string, any>
}

export interface ChannelUpdateInput {
    name?: string
    channelIdentifier?: string
    isActive?: boolean
}

export interface ChannelsFilter {
    projectId?: string
    socialMedia?: SocialMedia | null
    isActive?: boolean | null
    search?: string
}

export function useChannels() {
    const api = useApi()
    const { t } = useI18n()
    const toast = useToast()

    const channels = ref<ChannelWithProject[]>([])
    const currentChannel = ref<ChannelWithProject | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const filter = ref<ChannelsFilter>({})

    const socialMediaOptions = computed(() => {
        const options: { value: SocialMedia; label: string }[] = [
            { value: 'TELEGRAM', label: t('socialMedia.telegram') },
            { value: 'INSTAGRAM', label: t('socialMedia.instagram') },
            { value: 'VK', label: t('socialMedia.vk') },
            { value: 'YOUTUBE', label: t('socialMedia.youtube') },
            { value: 'TIKTOK', label: t('socialMedia.tiktok') },
            { value: 'X', label: t('socialMedia.x') },
            { value: 'FACEBOOK', label: t('socialMedia.facebook') },
            { value: 'LINKEDIN', label: t('socialMedia.linkedin') },
            { value: 'SITE', label: t('socialMedia.site') },
        ]
        return options
    })

    async function fetchChannels(projectId: string): Promise<ChannelWithProject[]> {
        isLoading.value = true
        error.value = null

        try {
            const data = await api.get<ChannelWithProject[]>('/channels', {
                params: { projectId }
            })
            channels.value = data
            return data
        } catch (err: any) {
            const message = err.message || 'Failed to fetch channels'
            error.value = message
            return []
        } finally {
            isLoading.value = false
        }
    }

    async function fetchChannel(channelId: string): Promise<ChannelWithProject | null> {
        isLoading.value = true
        error.value = null

        try {
            const data = await api.get<ChannelWithProject>(`/channels/${channelId}`)
            currentChannel.value = data
            return data
        } catch (err: any) {
            const message = err.message || 'Failed to fetch channel'
            error.value = message
            return null
        } finally {
            isLoading.value = false
        }
    }

    async function createChannel(data: ChannelCreateInput): Promise<Channel | null> {
        isLoading.value = true
        error.value = null

        try {
            const channel = await api.post<Channel>('/channels', data)
            toast.add({
                title: t('common.success'),
                description: t('channel.createSuccess'),
                color: 'success',
            })
            if (data.projectId) {
                await fetchChannels(data.projectId)
            }
            return channel
        } catch (err: any) {
            const message = err.message || 'Failed to create channel'
            error.value = message
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return null
        } finally {
            isLoading.value = false
        }
    }

    async function updateChannel(channelId: string, data: ChannelUpdateInput): Promise<Channel | null> {
        isLoading.value = true
        error.value = null

        try {
            const updatedChannel = await api.patch<Channel>(`/channels/${channelId}`, data)
            toast.add({
                title: t('common.success'),
                description: t('channel.updateSuccess'),
                color: 'success',
            })
            return updatedChannel
        } catch (err: any) {
            const message = err.message || 'Failed to update channel'
            error.value = message
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return null
        } finally {
            isLoading.value = false
        }
    }

    async function deleteChannel(channelId: string): Promise<boolean> {
        isLoading.value = true
        error.value = null

        try {
            await api.delete(`/channels/${channelId}`)
            toast.add({
                title: t('common.success'),
                description: t('channel.deleteSuccess'),
                color: 'success',
            })
            return true
        } catch (err: any) {
            const message = err.message || 'Failed to delete channel'
            error.value = message
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return false
        } finally {
            isLoading.value = false
        }
    }

    async function archiveChannel(channelId: string): Promise<Channel | null> {
        isLoading.value = true
        error.value = null

        try {
            const updatedChannel = await api.post<Channel>(`/channels/${channelId}/archive`)
            toast.add({
                title: t('common.success'),
                description: t('channel.archiveSuccess', 'Channel archived successfully'),
                color: 'success',
            })
            currentChannel.value = updatedChannel as ChannelWithProject
            return updatedChannel
        } catch (err: any) {
            const message = err.message || 'Failed to archive channel'
            error.value = message
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return null
        } finally {
            isLoading.value = false
        }
    }

    async function unarchiveChannel(channelId: string): Promise<Channel | null> {
        isLoading.value = true
        error.value = null

        try {
            const updatedChannel = await api.post<Channel>(`/channels/${channelId}/unarchive`)
            toast.add({
                title: t('common.success'),
                description: t('channel.unarchiveSuccess', 'Channel unarchived successfully'),
                color: 'success',
            })
            currentChannel.value = updatedChannel as ChannelWithProject
            return updatedChannel
        } catch (err: any) {
            const message = err.message || 'Failed to unarchive channel'
            error.value = message
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return null
        } finally {
            isLoading.value = false
        }
    }

    async function toggleChannelActive(channelId: string): Promise<boolean> {
        const channel = channels.value.find(c => c.id === channelId)
        const isCurrent = currentChannel.value?.id === channelId

        if (!channel && !isCurrent) return false

        const currentIsActive = isCurrent ? currentChannel.value?.isActive : channel?.isActive
        const newValue = !currentIsActive

        const result = await updateChannel(channelId, { isActive: newValue })

        if (result) {
            // Update in list
            if (channel) {
                channel.isActive = newValue
            }
            // Update current channel reference
            if (isCurrent && currentChannel.value) {
                currentChannel.value = { ...currentChannel.value, isActive: newValue }
            }
            return true
        }
        return false
    }

    function setFilter(newFilter: Partial<ChannelsFilter>) {
        filter.value = { ...filter.value, ...newFilter }
    }

    function clearFilter() {
        filter.value = {}
    }

    function getSocialMediaColor(socialMedia: SocialMedia): string {
        const colors: Record<string, string> = {
            TELEGRAM: '#0088cc',
            INSTAGRAM: '#e1306c',
            VK: '#4a76a8',
            YOUTUBE: '#ff0000',
            TIKTOK: '#000000',
            X: '#000000',
            FACEBOOK: '#1877f2',
            LINKEDIN: '#0077b5',
            SITE: '#6b7280',
        }
        return colors[socialMedia] || '#6b7280'
    }

    function getSocialMediaIcon(socialMedia: SocialMedia): string {
        const icons: Record<string, string> = {
            TELEGRAM: 'i-simple-icons-telegram',
            INSTAGRAM: 'i-simple-icons-instagram',
            VK: 'i-simple-icons-vk',
            YOUTUBE: 'i-simple-icons-youtube',
            TIKTOK: 'i-simple-icons-tiktok',
            X: 'i-simple-icons-x',
            FACEBOOK: 'i-simple-icons-facebook',
            LINKEDIN: 'i-simple-icons-linkedin',
            SITE: 'i-heroicons-globe-alt',
        }
        return icons[socialMedia] || 'i-heroicons-hashtag'
    }

    function getSocialMediaDisplayName(socialMedia: SocialMedia): string {
        return t(`socialMedia.${socialMedia}`)
    }

    return {
        channels,
        currentChannel,
        isLoading,
        error,
        filter,
        socialMediaOptions,
        fetchChannels,
        fetchChannel,
        createChannel,
        updateChannel,
        deleteChannel,
        archiveChannel,
        unarchiveChannel,
        toggleChannelActive,
        setFilter,
        clearFilter,
        getSocialMediaDisplayName,
        getSocialMediaIcon,
        getSocialMediaColor,
    }
}
