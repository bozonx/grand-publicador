import { ref, computed } from 'vue'

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed'
export type PostType = 'post' | 'article' | 'news' | 'video' | 'short'

export interface Post {
    id: string
    channelId: string
    authorId: string | null
    content: string
    socialMedia: string
    postType: PostType
    title: string | null
    description: string | null
    authorComment: string | null
    tags: string[] | null
    postDate: string | null
    status: PostStatus
    scheduledAt: string | null
    publishedAt: string | null
    createdAt: string
    updatedAt: string
}

export interface PostWithRelations extends Post {
    channel?: {
        id: string
        name: string
        projectId: string
        socialMedia: string
    } | null
    author?: {
        id: string
        fullName: string | null
        username: string | null
        avatarUrl: string | null
    } | null
}

export interface PostCreateInput {
    channelId: string
    content: string
    postType: PostType
    title?: string
    description?: string
    authorComment?: string
    tags?: string[]
    postDate?: string
    status?: PostStatus
    scheduledAt?: string
}

export interface PostUpdateInput {
    content?: string
    postType?: PostType
    title?: string
    description?: string
    authorComment?: string
    tags?: string[]
    postDate?: string
    status?: PostStatus
    scheduledAt?: string
}

export interface PostsFilter {
    status?: PostStatus | null
    postType?: PostType | null
    authorId?: string | null
    channelId?: string | null
    search?: string
}

export function usePosts() {
    const api = useApi()
    const { user } = useAuth()
    const { t } = useI18n()
    const toast = useToast()

    const posts = ref<PostWithRelations[]>([])
    const currentPost = ref<PostWithRelations | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const filter = ref<PostsFilter>({})
    const totalCount = ref(0)

    async function fetchPostsByProject(projectId: string): Promise<PostWithRelations[]> {
        isLoading.value = true
        error.value = null

        try {
            const data = await api.get<PostWithRelations[]>(`/api/posts?projectId=${projectId}`)
            posts.value = data
            return data
        } catch (err: any) {
            console.error('[usePosts] fetchPostsByProject error:', err)
            return []
        } finally {
            isLoading.value = false
        }
    }

    async function fetchPost(postId: string): Promise<PostWithRelations | null> {
        isLoading.value = true
        error.value = null

        try {
            const data = await api.get<PostWithRelations>(`/posts/${postId}`)
            currentPost.value = data
            return data
        } catch (err: any) {
            console.error('[usePosts] fetchPost error:', err)
            return null
        } finally {
            isLoading.value = false
        }
    }

    async function createPost(data: PostCreateInput): Promise<Post | null> {
        isLoading.value = true
        error.value = null

        try {
            const post = await api.post<Post>('/posts', data)
            toast.add({
                title: t('common.success'),
                description: t('post.createSuccess'),
                color: 'success',
            })
            return post
        } catch (err: any) {
            const message = err.message || 'Failed to create post'
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

    async function updatePost(postId: string, data: PostUpdateInput): Promise<Post | null> {
        isLoading.value = true
        error.value = null

        try {
            const post = await api.patch<Post>(`/posts/${postId}`, data)
            toast.add({
                title: t('common.success'),
                description: t('post.updateSuccess'),
                color: 'success',
            })
            return post
        } catch (err: any) {
            const message = err.message || 'Failed to update post'
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

    async function deletePost(postId: string): Promise<boolean> {
        isLoading.value = true
        error.value = null

        try {
            await api.delete(`/posts/${postId}`)
            toast.add({
                title: t('common.success'),
                description: t('post.deleteSuccess'),
                color: 'success',
            })
            return true
        } catch (err: any) {
            const message = err.message || 'Failed to delete post'
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

    // Pagination
    const pagination = ref({
        page: 1,
        limit: 10,
    })
    const totalPages = computed(() => Math.ceil(totalCount.value / pagination.value.limit))

    function setPage(page: number) {
        pagination.value.page = page
    }

    // Filters
    function setFilter(newFilter: Partial<PostsFilter>) {
        filter.value = { ...filter.value, ...newFilter }
        pagination.value.page = 1 // Reset to first page on filter change
    }

    function clearFilter() {
        filter.value = {}
        pagination.value.page = 1
    }

    // Constants
    const statusOptions = computed(() => [
        { value: 'draft', label: t('postStatus.draft') },
        { value: 'scheduled', label: t('postStatus.scheduled') },
        { value: 'published', label: t('postStatus.published') },
        { value: 'failed', label: t('postStatus.failed') },
    ])

    const typeOptions = computed(() => [
        { value: 'post', label: t('postType.post') },
        { value: 'article', label: t('postType.article') },
        { value: 'news', label: t('postType.news') },
        { value: 'video', label: t('postType.video') },
        { value: 'short', label: t('postType.short') },
    ])

    // Helpers
    function getStatusDisplayName(status: PostStatus): string {
        return t(`postStatus.${status}`)
    }

    function getTypeDisplayName(type: PostType): string {
        return t(`postType.${type}`)
    }

    function getStatusColor(status: PostStatus): 'neutral' | 'warning' | 'success' | 'error' {
        const colors: Record<PostStatus, 'neutral' | 'warning' | 'success' | 'error'> = {
            draft: 'neutral',
            scheduled: 'warning',
            published: 'success',
            failed: 'error',
        }
        return colors[status] || 'neutral'
    }

    function canDelete(post: PostWithRelations): boolean {
        if (!user.value) return false
        // Allow deleting if user is author or if user is owner/admin of the project (logic can be refined)
        return post.authorId === user.value.id
    }

    function canEdit(post: PostWithRelations): boolean {
        // Same logic as delete for now
        return canDelete(post)
    }

    function clearCurrentPost() {
        currentPost.value = null
        error.value = null
    }

    return {
        posts,
        currentPost,
        isLoading,
        error,
        filter,
        totalCount,
        pagination,
        totalPages,
        statusOptions,
        typeOptions,
        fetchPostsByProject,
        fetchPost,
        createPost,
        updatePost,
        deletePost,
        setFilter,
        clearFilter,
        setPage,
        getStatusDisplayName,
        getTypeDisplayName,
        getStatusColor,
        canDelete,
        canEdit,
        clearCurrentPost,
    }
}
