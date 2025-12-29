import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useBlogsStore } from '~/stores/blogs'
import type { Blog, BlogWithRole, BlogMemberWithUser, BlogRole } from '~/stores/blogs'

export function useBlogs() {
    const api = useApi()
    const { user } = useAuth()
    const { t } = useI18n()
    const toast = useToast()

    const store = useBlogsStore()
    const { blogs, currentBlog, members, isLoading, error } = storeToRefs(store)

    async function fetchBlogs(): Promise<BlogWithRole[]> {
        store.setLoading(true)
        store.setError(null)

        try {
            const data = await api.get<BlogWithRole[]>('/blogs')
            store.setBlogs(data)
            return data
        } catch (err: any) {
            const message = err.message || 'Failed to fetch blogs'
            store.setError(message)
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return []
        } finally {
            store.setLoading(false)
        }
    }

    async function fetchBlog(blogId: string): Promise<BlogWithRole | null> {
        store.setLoading(true)
        store.setError(null)

        try {
            const data = await api.get<BlogWithRole>(`/blogs/${blogId}`)
            store.setCurrentBlog(data)
            return data
        } catch (err: any) {
            const message = err.message || 'Failed to fetch blog'
            store.setError(message)
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return null
        } finally {
            store.setLoading(false)
        }
    }

    async function createBlog(data: { name: string; description?: string }): Promise<Blog | null> {
        store.setLoading(true)
        store.setError(null)

        try {
            const blog = await api.post<Blog>('/blogs', data)
            toast.add({
                title: t('common.success'),
                description: t('blog.createSuccess'),
                color: 'success',
            })
            await fetchBlogs()
            return blog
        } catch (err: any) {
            const message = err.message || 'Failed to create blog'
            store.setError(message)
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return null
        } finally {
            store.setLoading(false)
        }
    }

    async function updateBlog(blogId: string, data: Partial<Blog>): Promise<Blog | null> {
        store.setLoading(true)
        store.setError(null)

        try {
            const updatedBlog = await api.patch<Blog>(`/blogs/${blogId}`, data)
            toast.add({
                title: t('common.success'),
                description: t('blog.updateSuccess'),
                color: 'success',
            })
            store.updateBlog(blogId, updatedBlog as BlogWithRole)
            return updatedBlog
        } catch (err: any) {
            const message = err.message || 'Failed to update blog'
            store.setError(message)
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return null
        } finally {
            store.setLoading(false)
        }
    }

    async function deleteBlog(blogId: string): Promise<boolean> {
        store.setLoading(true)
        store.setError(null)

        try {
            await api.delete(`/blogs/${blogId}`)
            toast.add({
                title: t('common.success'),
                description: t('blog.deleteSuccess'),
                color: 'success',
            })
            store.removeBlog(blogId)
            return true
        } catch (err: any) {
            const message = err.message || 'Failed to delete blog'
            store.setError(message)
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return false
        } finally {
            store.setLoading(false)
        }
    }

    async function fetchMembers(blogId: string): Promise<BlogMemberWithUser[]> {
        store.setLoading(true)
        try {
            const data = await api.get<BlogMemberWithUser[]>(`/blogs/${blogId}/members`)
            store.setMembers(data)
            return data
        } catch (err: any) {
            console.error('[useBlogs] fetchMembers error:', err)
            return []
        } finally {
            store.setLoading(false)
        }
    }

    async function addMember(blogId: string, emailOrUsername: string, role: string): Promise<boolean> {
        store.setLoading(true)
        try {
            await api.post(`/blogs/${blogId}/members`, { emailOrUsername, role })
            toast.add({
                title: t('common.success'),
                description: t('blogMember.addSuccess'),
                color: 'success',
            })
            await fetchMembers(blogId)
            return true
        } catch (err: any) {
            const message = err.message || 'Failed to add member'
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return false
        } finally {
            store.setLoading(false)
        }
    }

    async function updateMemberRole(blogId: string, userId: string, role: string): Promise<boolean> {
        store.setLoading(true)
        try {
            await api.patch(`/blogs/${blogId}/members/${userId}`, { role })
            toast.add({
                title: t('common.success'),
                description: t('blogMember.updateSuccess'),
                color: 'success',
            })
            await fetchMembers(blogId)
            return true
        } catch (err: any) {
            const message = err.message || 'Failed to update member role'
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return false
        } finally {
            store.setLoading(false)
        }
    }

    async function removeMember(blogId: string, userId: string): Promise<boolean> {
        store.setLoading(true)
        try {
            await api.delete(`/blogs/${blogId}/members/${userId}`)
            toast.add({
                title: t('common.success'),
                description: t('blogMember.removeSuccess'),
                color: 'success',
            })
            await fetchMembers(blogId)
            return true
        } catch (err: any) {
            const message = err.message || 'Failed to remove member'
            toast.add({
                title: t('common.error'),
                description: message,
                color: 'error',
            })
            return false
        } finally {
            store.setLoading(false)
        }
    }

    function canEdit(blog: BlogWithRole): boolean {
        if (!user.value) return false
        return blog.ownerId === user.value.id || blog.role === 'owner' || blog.role === 'admin'
    }

    function canDelete(blog: BlogWithRole): boolean {
        if (!user.value) return false
        return blog.ownerId === user.value.id || blog.role === 'owner'
    }

    function canManageMembers(blog: BlogWithRole): boolean {
        return canEdit(blog)
    }

    function getRoleDisplayName(role: BlogRole | undefined): string {
        if (!role) return t('roles.viewer')
        return t(`roles.${role}`)
    }

    function clearCurrentBlog() {
        store.setCurrentBlog(null)
        store.setError(null)
    }

    return {
        blogs,
        currentBlog,
        members,
        isLoading,
        error,
        fetchBlogs,
        fetchBlog,
        createBlog,
        updateBlog,
        deleteBlog,
        clearCurrentBlog,
        fetchMembers,
        addMember,
        updateMemberRole,
        removeMember,
        canEdit,
        canDelete,
        canManageMembers,
        getRoleDisplayName,
    }
}
