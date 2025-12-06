import type { Database } from '~/types/database.types'

type Channel = Database['public']['Tables']['channels']['Row']
type ChannelInsert = Database['public']['Tables']['channels']['Insert']
type ChannelUpdate = Database['public']['Tables']['channels']['Update']
type SocialMediaEnum = Database['public']['Enums']['social_media_enum']

/**
 * Extended channel type with blog information
 */
export interface ChannelWithBlog extends Channel {
  blog?: {
    id: string
    name: string
  } | null
  postsCount?: number
}

/**
 * Input data for creating a channel
 */
export interface ChannelCreateInput {
  name: string
  social_media: SocialMediaEnum
  channel_identifier: string
  is_active?: boolean
}

/**
 * Input data for updating a channel
 */
export interface ChannelUpdateInput {
  name?: string
  channel_identifier?: string
  is_active?: boolean
}

/**
 * Filter options for channels list
 */
export interface ChannelsFilter {
  social_media?: SocialMediaEnum | null
  is_active?: boolean | null
  search?: string
}

/**
 * Composable for managing channels
 * Provides CRUD operations and filtering capabilities
 */
export function useChannels() {
  const supabase = useSupabaseClient<Database>()
  const { t } = useI18n()
  const toast = useToast()

  // Note: Using shallowRef for channels to avoid deep reactivity type inference issues
  const channels = shallowRef<ChannelWithBlog[]>([])
  const currentChannel = shallowRef<ChannelWithBlog | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filter = ref<ChannelsFilter>({})

  /**
   * Available social media options from database enum
   */
  const socialMediaOptions = computed(() => {
    const options: { value: SocialMediaEnum; label: string }[] = [
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

  /**
   * Fetch all channels for a specific blog
   */
  async function fetchChannels(blogId: string): Promise<ChannelWithBlog[]> {
    isLoading.value = true
    error.value = null

    try {
      let query = supabase
        .from('channels')
        .select(
          `
          *,
          blog:blogs!channels_blog_id_fkey(id, name)
        `
        )
        .eq('blog_id', blogId)
        .order('created_at', { ascending: false })

      // Apply social media filter
      if (filter.value.social_media) {
        query = query.eq('social_media', filter.value.social_media)
      }

      // Apply active status filter
      if (filter.value.is_active !== null && filter.value.is_active !== undefined) {
        query = query.eq('is_active', filter.value.is_active)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Get posts count for each channel
      const channelsWithCounts: ChannelWithBlog[] = await Promise.all(
        (data || []).map(async (channel) => {
          const { count } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('channel_id', channel.id)

          return {
            ...channel,
            postsCount: count || 0,
          }
        })
      )

      // Apply search filter (client-side for name)
      let result = channelsWithCounts
      if (filter.value.search) {
        const searchLower = filter.value.search.toLowerCase()
        result = channelsWithCounts.filter(
          (ch) =>
            ch.name.toLowerCase().includes(searchLower) ||
            ch.channel_identifier.toLowerCase().includes(searchLower)
        )
      }

      channels.value = result
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch channels'
      error.value = message
      console.error('[useChannels] fetchChannels error:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single channel by ID
   */
  async function fetchChannel(channelId: string): Promise<ChannelWithBlog | null> {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('channels')
        .select(
          `
          *,
          blog:blogs!channels_blog_id_fkey(id, name)
        `
        )
        .eq('id', channelId)
        .single()

      if (fetchError) throw fetchError

      // Get posts count
      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', channelId)

      const channelWithCount: ChannelWithBlog = {
        ...data,
        postsCount: count || 0,
      }

      currentChannel.value = channelWithCount
      return channelWithCount
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch channel'
      error.value = message
      console.error('[useChannels] fetchChannel error:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new channel
   */
  async function createChannel(blogId: string, data: ChannelCreateInput): Promise<Channel | null> {
    isLoading.value = true
    error.value = null

    try {
      const channelData: ChannelInsert = {
        blog_id: blogId,
        name: data.name,
        social_media: data.social_media,
        channel_identifier: data.channel_identifier,
        is_active: data.is_active ?? true,
      }

      const { data: channel, error: createError } = await supabase
        .from('channels')
        .insert(channelData)
        .select()
        .single()

      if (createError) throw createError

      toast.add({
        title: t('common.success'),
        description: t('channel.createSuccess'),
        color: 'success',
      })

      // Refresh channels list
      await fetchChannels(blogId)

      return channel
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create channel'
      error.value = message
      console.error('[useChannels] createChannel error:', err)
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

  /**
   * Update an existing channel
   */
  async function updateChannel(
    channelId: string,
    data: ChannelUpdateInput
  ): Promise<Channel | null> {
    isLoading.value = true
    error.value = null

    try {
      const updateData: ChannelUpdate = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      const { data: channel, error: updateError } = await supabase
        .from('channels')
        .update(updateData)
        .eq('id', channelId)
        .select()
        .single()

      if (updateError) throw updateError

      toast.add({
        title: t('common.success'),
        description: t('channel.updateSuccess'),
        color: 'success',
      })

      // Update local state (shallowRef requires full replacement)
      if (currentChannel.value?.id === channelId) {
        const updatedCurrent: ChannelWithBlog = {
          ...currentChannel.value,
          name: channel.name,
          channel_identifier: channel.channel_identifier,
          is_active: channel.is_active,
          updated_at: channel.updated_at,
        }
        currentChannel.value = updatedCurrent
      }

      const index = channels.value.findIndex((ch) => ch.id === channelId)
      if (index !== -1) {
        const existing = channels.value[index]
        if (existing) {
          const updatedChannel: ChannelWithBlog = {
            ...existing,
            name: channel.name,
            channel_identifier: channel.channel_identifier,
            is_active: channel.is_active,
            updated_at: channel.updated_at,
          }
          const updated = [...channels.value]
          updated[index] = updatedChannel
          channels.value = updated
        }
      }

      return channel
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update channel'
      error.value = message
      console.error('[useChannels] updateChannel error:', err)
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

  /**
   * Delete a channel
   * Shows warning if there are associated posts
   */
  async function deleteChannel(channelId: string, blogId: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      // Check for associated posts
      const { count: postsCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', channelId)

      if (postsCount && postsCount > 0) {
        const confirmed = window.confirm(t('channel.deleteWithPostsConfirm', { count: postsCount }))
        if (!confirmed) {
          return false
        }
      }

      const { error: deleteError } = await supabase.from('channels').delete().eq('id', channelId)

      if (deleteError) throw deleteError

      toast.add({
        title: t('common.success'),
        description: t('channel.deleteSuccess'),
        color: 'success',
      })

      // Update local state
      const filteredChannels = channels.value.filter((ch) => ch.id !== channelId)
      channels.value = filteredChannels
      if (currentChannel.value?.id === channelId) {
        currentChannel.value = null
      }

      // Refresh channels list
      await fetchChannels(blogId)

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete channel'
      error.value = message
      console.error('[useChannels] deleteChannel error:', err)
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

  /**
   * Toggle channel active status
   */
  async function toggleChannelActive(channelId: string): Promise<boolean> {
    const channel = channels.value.find((ch) => ch.id === channelId)
    if (!channel) return false

    const result = await updateChannel(channelId, {
      is_active: !channel.is_active,
    })

    return !!result
  }

  /**
   * Set filter and refresh channels list
   */
  function setFilter(newFilter: ChannelsFilter) {
    filter.value = { ...filter.value, ...newFilter }
  }

  /**
   * Clear all filters
   */
  function clearFilter() {
    filter.value = {}
  }

  /**
   * Clear current channel state
   */
  function clearCurrentChannel() {
    currentChannel.value = null
    error.value = null
  }

  /**
   * Get social media display name
   */
  function getSocialMediaDisplayName(socialMedia: SocialMediaEnum): string {
    return t(`socialMedia.${socialMedia}`)
  }

  /**
   * Get social media icon name
   */
  function getSocialMediaIcon(socialMedia: SocialMediaEnum): string {
    const icons: Record<SocialMediaEnum, string> = {
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

  /**
   * Get social media brand color
   */
  function getSocialMediaColor(socialMedia: SocialMediaEnum): string {
    const colors: Record<SocialMediaEnum, string> = {
      telegram: '#0088cc',
      instagram: '#E4405F',
      vk: '#0077FF',
      youtube: '#FF0000',
      tiktok: '#000000',
      x: '#000000',
      facebook: '#1877F2',
      site: '#6B7280',
    }
    return colors[socialMedia] || '#6B7280'
  }

  return {
    // State
    channels,
    currentChannel,
    isLoading,
    error,
    filter,
    socialMediaOptions,

    // Methods
    fetchChannels,
    fetchChannel,
    createChannel,
    updateChannel,
    deleteChannel,
    toggleChannelActive,
    clearCurrentChannel,

    // Filter methods
    setFilter,
    clearFilter,

    // Helper methods
    getSocialMediaDisplayName,
    getSocialMediaIcon,
    getSocialMediaColor,
  }
}
