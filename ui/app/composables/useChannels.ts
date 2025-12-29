import { ref, computed } from 'vue'

export type SocialMedia = 'telegram' | 'instagram' | 'vk' | 'youtube' | 'tiktok' | 'x' | 'facebook' | 'site'

export interface Channel {
    id: string
    blogId: string
    socialMedia: SocialMedia
    name: string
    channelIdentifier: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface ChannelWithBlog extends Channel {
    blog?: {
        id: string
        name: string
    } | null
    postsCount?: number
}

export interface ChannelCreateInput {
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
    socialMedia?: SocialMedia | null
    isActive?: boolean | null
    search?: string
}

export function useChannels() {
    const api = useApi()
    const { t } = useI18n()
    const toast = useToast()

    const channels = ref<ChannelWithBlog[]>([])
    const currentChannel = ref<ChannelWithBlog | null>(null)
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

    async function fetchChannels(blogId: string): Promise<ChannelWithBlog[]> {
        isLoading.value = true
        error.value = null

        try {
            const data = await api.get<ChannelWithBlog[]>(`/blogs/${blogId}/channels`)
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

    async function fetchChannel(channelId: string): Promise<ChannelWithBlog | null> {
        isLoading.value = true
        error.value = null

        try {
            const data = await api.get<ChannelWithBlog>(`/channels/${channelId}`)
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

    async function createChannel(blogId: string, data: ChannelCreateInput): Promise<Channel | null> {
        isLoading.value = true
        error.value = null

        try {
            const channel = await api.post<Channel>(`/blogs/${blogId}/channels`, data)
            toast.add({
                title: t('common.success'),
                description: t('channel.createSuccess'),
                color: 'success',
            })
            await fetchChannels(blogId)
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

    function getSocialMediaDisplayName(socialMedia: SocialMedia): string {
        return t(`socialMedia.${socialMedia}`)
    }

    function getSocialMediaIcon(socialMedia: SocialMedia): string {
        const icons: Record<string, string> = {
            telegram: 'i-simple-icons-telegram',
            instagram: 'i-simple-icons-instagram',
            vk: 'i-simple-icons-vk',
            youtube: 'i-simple-icons-youtube',
            tiktok: 'i-simple-icons-tiktok',
            x: 'i-simple-icons-x',
            facebook: 'i-simple-icons-facebook',
            site: 'i-heroicons-globe-alt',
        }
        return icons[socialMedia] || 'i-heroicons-signal'
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
        getSocialMediaDisplayName,
        getSocialMediaIcon,
    }
}
