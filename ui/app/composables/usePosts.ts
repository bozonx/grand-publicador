import { ref, computed } from 'vue'
import { ArchiveEntityType } from '~/types/archive.types'

export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'
export type PostType = 'POST' | 'ARTICLE' | 'NEWS' | 'VIDEO' | 'SHORT'

export interface Post {
    id: string
    channelId: string
    authorId: string | null
    content: string | null
    socialMedia: string
    postType: PostType
    title: string | null
    description: string | null
    authorComment: string | null
    tags: string | null
    postDate: string | null
    status: PostStatus
    scheduledAt: string | null
    publishedAt: string | null
    createdAt: string
    updatedAt: string
    archivedAt: string | null
    language: string
    meta: string
}

export interface PostWithRelations extends Post {
    channel?: {
        id: string
        name: string
        projectId: string
        socialMedia: string
        language: string
    } | null
    author?: {
        id: string
        fullName: string | null
        username: string | null
        avatarUrl: string | null
    } | null
    publication?: {
        id: string
        title: string | null
        content: string
        status: string
    } | null
}

export interface PostCreateInput {
    channelId: string
    content: string
    postType: PostType
    socialMedia?: string
    title?: string
    description?: string
    authorComment?: string
    tags?: string | string[]
    postDate?: string
    status?: PostStatus
    scheduledAt?: string
}

export interface PostUpdateInput {
    content?: string
    postType?: PostType
    socialMedia?: string
    title?: string
    description?: string
    authorComment?: string
    tags?: string | string[]
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
    limit?: number
    page?: number
    includeArchived?: boolean
}

export function usePosts() {
    const api = useApi()
    const { user } = useAuth()
    const { t } = useI18n()
    const toast = useToast()
    const { archiveEntity, restoreEntity } = useArchive()

    const posts = ref<PostWithRelations[]>([])
    const currentPost = ref<PostWithRelations | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const filter = ref<PostsFilter>({})
    const totalCount = ref(0)

    async function fetchPostsByProject(projectId: string, options?: Partial<PostsFilter>): Promise<PostWithRelations[]> {
        isLoading.value = true
        error.value = null

        try {
            const params: Record<string, any> = { ...options }

            if (filter.value.channelId) {
                params.channelId = filter.value.channelId
            } else {
                params.projectId = projectId
            }

            if (filter.value.status) params.status = filter.value.status
            if (filter.value.postType) params.postType = filter.value.postType
            if (filter.value.search) params.search = filter.value.search
            if (filter.value.authorId) params.authorId = filter.value.authorId
            if (filter.value.includeArchived) params.includeArchived = true

            const data = await api.get<PostWithRelations[]>('/posts', { params })
            posts.value = data
            return data
        } catch (err: any) {
            console.error('[usePosts] fetchPostsByProject error:', err)
            posts.value = []
            return []
        } finally {
            isLoading.value = false
        }
    }

    async function fetchUserPosts(options?: Partial<PostsFilter>): Promise<PostWithRelations[]> {
        isLoading.value = true
        error.value = null

        try {
            const params: Record<string, any> = { ...options }

            if (filter.value.status) params.status = filter.value.status
            if (filter.value.postType) params.postType = filter.value.postType
            if (filter.value.search) params.search = filter.value.search
            if (filter.value.authorId) params.authorId = filter.value.authorId
            if (filter.value.includeArchived) params.includeArchived = true

            const data = await api.get<PostWithRelations[]>('/posts', { params })
            posts.value = data
            totalCount.value = data.length // Crude total count for now
            return data
        } catch (err: any) {
            console.error('[usePosts] fetchUserPosts error:', err)
            posts.value = []
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
            // Transform tags if they are an array
            const payload = { ...data }
            if (Array.isArray(payload.tags)) {
                payload.tags = payload.tags.join(', ')
            }

            const post = await api.post<Post>('/posts', payload)
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
            // Transform tags if they are an array
            const payload = { ...data }
            if (Array.isArray(payload.tags)) {
                payload.tags = payload.tags.join(', ')
            }

            const post = await api.patch<Post>(`/posts/${postId}`, payload)
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
        { value: 'DRAFT', label: t('postStatus.draft') },
        { value: 'SCHEDULED', label: t('postStatus.scheduled') },
        { value: 'PUBLISHED', label: t('postStatus.published') },
        { value: 'FAILED', label: t('postStatus.failed') },
    ])

    const typeOptions = computed(() => [
        { value: 'POST', label: t('postType.post') },
        { value: 'ARTICLE', label: t('postType.article') },
        { value: 'NEWS', label: t('postType.news') },
        { value: 'VIDEO', label: t('postType.video') },
        { value: 'SHORT', label: t('postType.short') },
    ])

    // Helpers
    function getStatusDisplayName(status: string): string {
        if (!status) return '-'
        return t(`postStatus.${status.toLowerCase()}`)
    }

    function getTypeDisplayName(type: string): string {
        if (!type) return '-'
        return t(`postType.${type.toLowerCase()}`)
    }

    function getStatusColor(status: string): 'neutral' | 'warning' | 'success' | 'error' {
        if (!status) return 'neutral'
        const colors: Record<string, 'neutral' | 'warning' | 'success' | 'error'> = {
            draft: 'neutral',
            scheduled: 'warning',
            published: 'success',
            failed: 'error',
        }
        return colors[status.toLowerCase()] || 'neutral'
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
        fetchUserPosts,
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
        async toggleArchive(postId: string) {
            if (!currentPost.value) return

            isLoading.value = true
            try {
                if (currentPost.value.archivedAt) {
                    await restoreEntity(ArchiveEntityType.POST, postId)
                } else {
                    await archiveEntity(ArchiveEntityType.POST, postId)
                }
                // Refresh post data
                await fetchPost(postId)
            } catch (err) {
                // Error handled by useArchive's toast
            } finally {
                isLoading.value = false
            }
        },
        clearCurrentPost,
    }
}
