import { ref, computed } from 'vue'
import { useApi } from './useApi'
import { useAuth } from './useAuth'

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
}

export function usePublications() {
    const api = useApi()
    const { user } = useAuth()
    const { t } = useI18n()
    const toast = useToast()

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

    return {
        publications,
        currentPublication,
        isLoading,
        error,
        totalCount,
        fetchPublicationsByProject,
        fetchPublication,
        getStatusDisplayName,
        getStatusColor,
    }
}
