import type { Database } from '~/types/database.types'

type Post = Database['public']['Tables']['posts']['Row']
type PostInsert = Database['public']['Tables']['posts']['Insert']
type PostUpdate = Database['public']['Tables']['posts']['Update']
type PostStatusEnum = Database['public']['Enums']['post_status_enum']
type PostTypeEnum = Database['public']['Enums']['post_type_enum']
type SocialMediaEnum = Database['public']['Enums']['social_media_enum']

/**
 * Extended post type with channel and author information
 */
export interface PostWithRelations extends Post {
  channel?: {
    id: string
    name: string
    blog_id: string
    social_media: SocialMediaEnum
  } | null
  author?: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

/**
 * Input data for creating a post
 */
export interface PostCreateInput {
  channel_id: string
  content: string
  post_type: PostTypeEnum
  title?: string
  description?: string
  author_comment?: string
  tags?: string[]
  post_date?: string
  status?: PostStatusEnum
  scheduled_at?: string
}

/**
 * Input data for updating a post
 */
export interface PostUpdateInput {
  content?: string
  post_type?: PostTypeEnum
  title?: string
  description?: string
  author_comment?: string
  tags?: string[]
  post_date?: string
  status?: PostStatusEnum
  scheduled_at?: string
}

/**
 * Filter options for posts list
 */
export interface PostsFilter {
  status?: PostStatusEnum | null
  post_type?: PostTypeEnum | null
  author_id?: string | null
  channel_id?: string | null
  search?: string
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number
  perPage: number
}

/**
 * Composable for managing posts
 * Provides CRUD operations, filtering, and pagination
 */
export function usePosts() {
  const supabase = useSupabaseClient<Database>()
  const { user } = useAuth()
  const { t } = useI18n()
  const toast = useToast()

  const posts = shallowRef<PostWithRelations[]>([])
  const currentPost = shallowRef<PostWithRelations | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filter = ref<PostsFilter>({})
  const pagination = ref<PaginationOptions>({ page: 1, perPage: 10 })
  const totalCount = ref(0)

  /**
   * Post status options
   */
  const statusOptions = computed(() => [
    { value: 'draft' as PostStatusEnum, label: t('postStatus.draft') },
    { value: 'scheduled' as PostStatusEnum, label: t('postStatus.scheduled') },
    { value: 'published' as PostStatusEnum, label: t('postStatus.published') },
    { value: 'failed' as PostStatusEnum, label: t('postStatus.failed') },
  ])

  /**
   * Post type options
   */
  const typeOptions = computed(() => [
    { value: 'post' as PostTypeEnum, label: t('postType.post') },
    { value: 'article' as PostTypeEnum, label: t('postType.article') },
    { value: 'news' as PostTypeEnum, label: t('postType.news') },
    { value: 'video' as PostTypeEnum, label: t('postType.video') },
    { value: 'short' as PostTypeEnum, label: t('postType.short') },
  ])

  /**
   * Get total pages count
   */
  const totalPages = computed(() => 
    Math.ceil(totalCount.value / pagination.value.perPage)
  )

  /**
   * Fetch posts for a specific blog (via channels)
   */
  async function fetchPostsByBlog(blogId: string): Promise<PostWithRelations[]> {
    isLoading.value = true
    error.value = null

    try {
      // First get all channel IDs for this blog
      const { data: channelsData } = await supabase
        .from('channels')
        .select('id')
        .eq('blog_id', blogId)

      if (!channelsData || channelsData.length === 0) {
        posts.value = []
        totalCount.value = 0
        return []
      }

      const channelIds = channelsData.map(c => c.id)

      // Build query
      let query = supabase
        .from('posts')
        .select(`
          *,
          channel:channels!posts_channel_id_fkey(id, name, blog_id, social_media),
          author:users!posts_author_id_fkey(id, full_name, username, avatar_url)
        `, { count: 'exact' })
        .in('channel_id', channelIds)

      // Apply filters
      if (filter.value.status) {
        query = query.eq('status', filter.value.status)
      }
      if (filter.value.post_type) {
        query = query.eq('post_type', filter.value.post_type)
      }
      if (filter.value.author_id) {
        query = query.eq('author_id', filter.value.author_id)
      }
      if (filter.value.channel_id) {
        query = query.eq('channel_id', filter.value.channel_id)
      }

      // Apply pagination
      const from = (pagination.value.page - 1) * pagination.value.perPage
      const to = from + pagination.value.perPage - 1

      query = query
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data, count, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Apply client-side search filter
      let result = (data || []) as PostWithRelations[]
      if (filter.value.search) {
        const searchLower = filter.value.search.toLowerCase()
        result = result.filter(
          (post) =>
            post.title?.toLowerCase().includes(searchLower) ||
            post.content.toLowerCase().includes(searchLower) ||
            post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }

      posts.value = result
      totalCount.value = count || 0
      return result
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch posts'
      error.value = message
      console.error('[usePosts] fetchPostsByBlog error:', err)
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch posts for a specific channel
   */
  async function fetchPostsByChannel(channelId: string): Promise<PostWithRelations[]> {
    isLoading.value = true
    error.value = null

    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          channel:channels!posts_channel_id_fkey(id, name, blog_id, social_media),
          author:users!posts_author_id_fkey(id, full_name, username, avatar_url)
        `, { count: 'exact' })
        .eq('channel_id', channelId)

      // Apply filters
      if (filter.value.status) {
        query = query.eq('status', filter.value.status)
      }
      if (filter.value.post_type) {
        query = query.eq('post_type', filter.value.post_type)
      }
      if (filter.value.author_id) {
        query = query.eq('author_id', filter.value.author_id)
      }

      // Apply pagination
      const from = (pagination.value.page - 1) * pagination.value.perPage
      const to = from + pagination.value.perPage - 1

      query = query
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data, count, error: fetchError } = await query

      if (fetchError) throw fetchError

      posts.value = (data || []) as PostWithRelations[]
      totalCount.value = count || 0
      return posts.value
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch posts'
      error.value = message
      console.error('[usePosts] fetchPostsByChannel error:', err)
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single post by ID
   */
  async function fetchPost(postId: string): Promise<PostWithRelations | null> {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          channel:channels!posts_channel_id_fkey(id, name, blog_id, social_media),
          author:users!posts_author_id_fkey(id, full_name, username, avatar_url)
        `)
        .eq('id', postId)
        .single()

      if (fetchError) throw fetchError

      currentPost.value = data as PostWithRelations
      return currentPost.value
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch post'
      error.value = message
      console.error('[usePosts] fetchPost error:', err)
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new post
   */
  async function createPost(data: PostCreateInput): Promise<Post | null> {
    if (!user.value?.id) {
      error.value = 'User not authenticated'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      // Get channel info to set social_media
      const { data: channel } = await supabase
        .from('channels')
        .select('social_media')
        .eq('id', data.channel_id)
        .single()

      if (!channel) {
        throw new Error('Channel not found')
      }

      const postData: PostInsert = {
        channel_id: data.channel_id,
        author_id: user.value.id,
        content: data.content,
        social_media: channel.social_media,
        post_type: data.post_type,
        title: data.title || null,
        description: data.description || null,
        author_comment: data.author_comment || null,
        tags: data.tags || null,
        post_date: data.post_date || null,
        status: data.status || 'draft',
        scheduled_at: data.scheduled_at || null,
      }

      const { data: post, error: createError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single()

      if (createError) throw createError

      toast.add({
        title: t('common.success'),
        description: t('post.createSuccess'),
        color: 'success'
      })

      return post
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create post'
      error.value = message
      console.error('[usePosts] createPost error:', err)
      toast.add({
        title: t('common.error'),
        description: message,
        color: 'error'
      })
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Update an existing post
   */
  async function updatePost(postId: string, data: PostUpdateInput): Promise<Post | null> {
    isLoading.value = true
    error.value = null

    try {
      const updateData: PostUpdate = {
        ...data,
        updated_at: new Date().toISOString()
      }

      const { data: post, error: updateError } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .select()
        .single()

      if (updateError) throw updateError

      toast.add({
        title: t('common.success'),
        description: t('post.updateSuccess'),
        color: 'success'
      })

      // Update local state
      if (currentPost.value?.id === postId) {
        currentPost.value = {
          ...currentPost.value,
          ...post
        }
      }

      return post
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update post'
      error.value = message
      console.error('[usePosts] updatePost error:', err)
      toast.add({
        title: t('common.error'),
        description: message,
        color: 'error'
      })
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a post
   */
  async function deletePost(postId: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (deleteError) throw deleteError

      toast.add({
        title: t('common.success'),
        description: t('post.deleteSuccess'),
        color: 'success'
      })

      // Update local state
      const filtered = posts.value.filter((p) => p.id !== postId)
      posts.value = filtered
      
      if (currentPost.value?.id === postId) {
        currentPost.value = null
      }

      return true
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete post'
      error.value = message
      console.error('[usePosts] deletePost error:', err)
      toast.add({
        title: t('common.error'),
        description: message,
        color: 'error'
      })
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Set filter and reset pagination
   */
  function setFilter(newFilter: PostsFilter) {
    filter.value = { ...filter.value, ...newFilter }
    pagination.value.page = 1
  }

  /**
   * Clear all filters
   */
  function clearFilter() {
    filter.value = {}
    pagination.value.page = 1
  }

  /**
   * Set page
   */
  function setPage(page: number) {
    pagination.value.page = page
  }

  /**
   * Clear current post state
   */
  function clearCurrentPost() {
    currentPost.value = null
    error.value = null
  }

  /**
   * Get status display name
   */
  function getStatusDisplayName(status: PostStatusEnum | null | undefined): string {
    if (!status) return t('postStatus.draft')
    return t(`postStatus.${status}`)
  }

  /**
   * Get post type display name
   */
  function getTypeDisplayName(type: PostTypeEnum): string {
    return t(`postType.${type}`)
  }

  /**
   * Get status badge color
   */
  function getStatusColor(status: PostStatusEnum | null | undefined): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
    const colors: Record<PostStatusEnum, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
      draft: 'neutral',
      scheduled: 'warning',
      published: 'success',
      failed: 'error'
    }
    return status ? colors[status] : 'neutral'
  }

  /**
   * Check if current user can edit the post
   */
  function canEdit(post: PostWithRelations): boolean {
    if (!user.value?.id) return false
    // Author can edit
    if (post.author_id === user.value.id) return true
    // TODO: Check blog role (owner/admin)
    return true
  }

  /**
   * Check if current user can delete the post
   */
  function canDelete(post: PostWithRelations): boolean {
    return canEdit(post)
  }

  return {
    // State
    posts,
    currentPost,
    isLoading,
    error,
    filter,
    pagination,
    totalCount,
    totalPages,
    statusOptions,
    typeOptions,

    // Methods
    fetchPostsByBlog,
    fetchPostsByChannel,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    clearCurrentPost,

    // Filter and pagination
    setFilter,
    clearFilter,
    setPage,

    // Helpers
    getStatusDisplayName,
    getTypeDisplayName,
    getStatusColor,
    canEdit,
    canDelete
  }
}
