import type { ApiToken, CreateApiTokenDto, UpdateApiTokenDto } from '~/types/api-tokens.types'

/**
 * Composable for managing user API tokens
 */
export function useApiTokens() {
    const api = useApi()
    const toast = useToast()

    const tokens = ref\u003cApiToken[]\u003e([])
    const loading = ref(false)
    const error = ref\u003cstring | null\u003e(null)

    /**
     * Fetch all API tokens for the current user
     */
    async function fetchTokens() {
        loading.value = true
        error.value = null

        try {
            const response = await api('/api-tokens')
            tokens.value = response
            return response
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch API tokens'
            toast.add({
                title: 'Error',
                description: error.value,
                color: 'red',
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Create a new API token
     */
    async function createToken(dto: CreateApiTokenDto): Promise\u003cApiToken\u003e {
        loading.value = true
        error.value = null

        try {
            const response = await api('/api-tokens', {
                method: 'POST',
                body: dto,
            })

            tokens.value.unshift(response)

            toast.add({
                title: 'Success',
                description: 'API token created successfully',
                color: 'green',
            })

            return response
        } catch (err: any) {
            error.value = err.message || 'Failed to create API token'
            toast.add({
                title: 'Error',
                description: error.value,
                color: 'red',
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Update an existing API token (name and scope only)
     */
    async function updateToken(id: string, dto: UpdateApiTokenDto): Promise\u003cApiToken\u003e {
        loading.value = true
        error.value = null

        try {
            const response = await api(`/api-tokens/${id}`, {
                method: 'PATCH',
                body: dto,
            })

            const index = tokens.value.findIndex((t) =\u003e t.id === id)
            if (index !== -1) {
                tokens.value[index] = response
            }

            toast.add({
                title: 'Success',
                description: 'API token updated successfully',
                color: 'green',
            })

            return response
        } catch (err: any) {
            error.value = err.message || 'Failed to update API token'
            toast.add({
                title: 'Error',
                description: error.value,
                color: 'red',
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Delete an API token
     */
    async function deleteToken(id: string): Promise\u003cvoid\u003e {
        loading.value = true
        error.value = null

        try {
            await api(`/api-tokens/${id}`, {
                method: 'DELETE',
            })

            tokens.value = tokens.value.filter((t) =\u003e t.id !== id)

            toast.add({
                title: 'Success',
                description: 'API token deleted successfully',
                color: 'green',
            })
        } catch (err: any) {
            error.value = err.message || 'Failed to delete API token'
            toast.add({
                title: 'Error',
                description: error.value,
                color: 'red',
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Copy token to clipboard
     */
    async function copyToken(token: string) {
        try {
            await navigator.clipboard.writeText(token)
            toast.add({
                title: 'Copied',
                description: 'Token copied to clipboard',
                color: 'green',
            })
        } catch (err) {
            toast.add({
                title: 'Error',
                description: 'Failed to copy token',
                color: 'red',
            })
        }
    }

    return {
        tokens,
        loading,
        error,
        fetchTokens,
        createToken,
        updateToken,
        deleteToken,
        copyToken,
    }
}
