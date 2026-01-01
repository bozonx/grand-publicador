import { ref, computed } from 'vue'
import { useApi } from './useApi'
import { useAuth } from './useAuth'
import { ArchiveEntityType } from '~/types/archive.types'
export type PublicationStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'

export interface Publication {
    id: string
    projectId: string
    authorId: string | null
    title: string | null
    content: string
    mediaFiles: string
    tags: string | null
    status: PublicationStatus
    meta: string
    createdAt: string
    updatedAt: string
    archivedAt?: string | null
}

export interface PublicationWithRelations extends Publication {
    author?: {
        id: string
        fullName: string | null
        telegramUsername: string | null
        avatarUrl: string | null
    } | null
    posts?: any[]
    _count?: {
        posts: number
    }
}

export interface PublicationsFilter {
    status?: PublicationStatus | null
    limit?: number
    offset?: number
    includeArchived?: boolean
}

export function usePublications() {
    const api = useApi()
    const { user } = useAuth()
    const { t } = useI18n()
    const toast = useToast()
    const { archiveEntity, restoreEntity } = useArchive()

    const publications = ref<PublicationWithRelations[]>([])
    const currentPublication = ref<PublicationWithRelations | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const totalCount = ref(0) // Note: Backend findAll doesn't seem to return total count yet, just the list

    async function fetchPublicationsByProject(
        projectId: string,
        filters: PublicationsFilter = {}
    ): Promise<PublicationWithRelations[]> {
        isLoading.value = true
        error.value = null

        try {
            const params: Record<string, any> = { projectId }
            if (filters.status) params.status = filters.status
            if (filters.limit) params.limit = filters.limit
            if (filters.offset) params.offset = filters.offset
            if (filters.includeArchived) params.includeArchived = true

            const data = await api.get<PublicationWithRelations[]>('/publications', { params })
            publications.value = data
            return data
        } catch (err: any) {
            console.error('[usePublications] fetchPublicationsByProject error:', err)
            error.value = err.message || 'Failed to fetch publications'
            publications.value = []
            return []
        } finally {
            isLoading.value = false
        }
    }

    async function fetchPublication(id: string): Promise<PublicationWithRelations | null> {
        isLoading.value = true
        error.value = null

        try {
            const data = await api.get<PublicationWithRelations>(`/publications/${id}`)
            currentPublication.value = data
            return data
        } catch (err: any) {
            console.error('[usePublications] fetchPublication error:', err)
            error.value = err.message || 'Failed to fetch publication'
            return null
        } finally {
            isLoading.value = false
        }
    }

    function getStatusDisplayName(status: string): string {
        if (!status) return '-'
        // Reuse postStatus translations if they fit
        return t(`postStatus.${status.toLowerCase()}`)
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

    async function createPublication(data: any): Promise<PublicationWithRelations> {
        isLoading.value = true
        error.value = null

        try {
            const result = await api.post<PublicationWithRelations>('/publications', data)
            publications.value.unshift(result)
            return result
        } catch (err: any) {
            console.error('[usePublications] createPublication error:', err)
            error.value = err.message || 'Failed to create publication'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function updatePublication(id: string, data: any): Promise<PublicationWithRelations> {
        isLoading.value = true
        error.value = null

        try {
            const result = await api.patch<PublicationWithRelations>(`/publications/${id}`, data)
            const index = publications.value.findIndex(p => p.id === id)
            if (index !== -1) {
                publications.value[index] = result
            }
            if (currentPublication.value?.id === id) {
                currentPublication.value = result
            }
            return result
        } catch (err: any) {
            console.error('[usePublications] updatePublication error:', err)
            error.value = err.message || 'Failed to update publication'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function deletePublication(id: string): Promise<boolean> {
        isLoading.value = true
        error.value = null

        try {
            await api.delete(`/publications/${id}`)
            publications.value = publications.value.filter(p => p.id !== id)
            if (currentPublication.value?.id === id) {
                currentPublication.value = null
            }
            toast.add({
                title: t('common.success'),
                description: t('publication.deleted', 'Publication deleted successfully'),
                color: 'success'
            })
            return true
        } catch (err: any) {
            console.error('[usePublications] deletePublication error:', err)
            error.value = err.message || 'Failed to delete publication'
            toast.add({
                title: t('common.error'),
                description: error.value || 'Failed to delete publication',
                color: 'error'
            })
            return false
        } finally {
            isLoading.value = false
        }
    }

    async function createPostsFromPublication(id: string, channelIds: string[], scheduledAt?: string): Promise<any> {
        isLoading.value = true
        error.value = null

        try {
            const result = await api.post(`/publications/${id}/posts`, {
                channelIds,
                scheduledAt
            })
            return result
        } catch (err: any) {
            console.error('[usePublications] createPostsFromPublication error:', err)
            error.value = err.message || 'Failed to create posts'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function toggleArchive(publicationId: string, isArchived: boolean) {
        isLoading.value = true
        try {
            if (isArchived) {
                await restoreEntity(ArchiveEntityType.PUBLICATION, publicationId)
            } else {
                await archiveEntity(ArchiveEntityType.PUBLICATION, publicationId)
            }
            // Refresh
            if (currentPublication.value?.id === publicationId) {
                await fetchPublication(publicationId)
            } else {
                // If in list, refresh list? Or just update local item if possible?
                // Re-fetch is safest for now as we don't know filtering context perfectly
                // access projectId from current view? We don't have it here.
                // But we can check if the publication is in the `publications` list
                const idx = publications.value.findIndex(p => p.id === publicationId)
                if (idx !== -1) {
                    const pub = publications.value[idx]
                    await fetchPublicationsByProject(pub.projectId, { includeArchived: true }) // crude refresh
                }
            }
        } catch (e) {
            // handled by useArchive
        } finally {
            isLoading.value = false
        }
    }

    return {
        publications,
        currentPublication,
        isLoading,
        error,
        totalCount,
        fetchPublicationsByProject,
        fetchPublication,
        createPublication,
        updatePublication,
        deletePublication,
        createPostsFromPublication,
        getStatusDisplayName,
        getStatusColor,
        toggleArchive,
    }
}

