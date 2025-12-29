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
        blogId: string
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

    async function fetchPostsByBlog(blogId: string): Promise<PostWithRelations[]> {
        isLoading.value = true
        error.value = null

        try {
            const data = await api.get<PostWithRelations[]>(`/posts?blogId=${blogId}`)
            posts.value = data
            return data
        } catch (err: any) {
            console.error('[usePosts] fetchPostsByBlog error:', err)
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

    return {
        posts,
        currentPost,
        isLoading,
        error,
        totalCount,
        fetchPostsByBlog,
        fetchPost,
        createPost,
        updatePost,
        deletePost,
    }
}
