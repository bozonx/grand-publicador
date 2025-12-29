import { ref, computed } from 'vue'

export type SocialMedia = 'telegram' | 'instagram' | 'vk' | 'youtube' | 'tiktok' | 'x' | 'facebook' | 'site'

export interface Channel {
    id: string
    projectId: string
    socialMedia: SocialMedia
    name: string
    channelIdentifier: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface ChannelWithProject extends Channel {
    project?: {
        id: string
        name: string
    } | null
    postsCount?: number
}

export interface ChannelCreateInput {
    projectId: string
    name: string
    socialMedia: SocialMedia
    channelIdentifier: string
    isActive?: boolean
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
            { value: 'telegram', label: t('socialMedia.telegram') },
            { value: 'instagram', label: t('socialMedia.instagram') },
            { value: 'vk', label: t('socialMedia.vk') },
            { value: 'youtube', label: t('socialMedia.youtube') },
            { value: 'tiktok', label: t('socialMedia.tiktok') },
            { value: 'x', label: t('socialMedia.x') },
            { value: 'facebook', label: t('socialMedia.facebook') },
            { value: 'site', label: t('socialMedia.site') },
        ]
        return options
    })

    async function fetchChannels(projectId: string): Promise<ChannelWithProject[]> {
        isLoading.value = true
        error.value = null

        try {
            const data = await api.get<ChannelWithProject[]>('/api/channels', {
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
            const data = await api.get<ChannelWithProject>(`/api/channels/${channelId}`)
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
            const channel = await api.post<Channel>('/api/channels', data)
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

    async function toggleChannelActive(channelId: string): Promise<boolean> {
        const channel = channels.value.find(c => c.id === channelId)
        if (!channel) return false

        const newValue = !channel.isActive
        const result = await updateChannel(channelId, { isActive: newValue })

        if (result) {
            // Optimistic update
            channel.isActive = newValue
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
            telegram: '#0088cc',
            instagram: '#e1306c',
            vk: '#4a76a8',
            youtube: '#ff0000',
            tiktok: '#000000',
            x: '#000000',
            facebook: '#1877f2',
            site: '#6b7280',
        }
        return colors[socialMedia] || '#6b7280'
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
        toggleChannelActive,
        setFilter,
        clearFilter,
        getSocialMediaDisplayName,
        getSocialMediaIcon,
        getSocialMediaColor,
    }
}
