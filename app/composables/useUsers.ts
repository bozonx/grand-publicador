
import type { Database } from '~/types/database.types'
import { useUsersStore } from '~/stores/users'
import type { UserWithStats, UsersFilter, UsersPaginationOptions } from '~/stores/users'
import { formatError } from '~/utils/error'

type User = Database['public']['Tables']['users']['Row']
type UserUpdate = Database['public']['Tables']['users']['Update']



/**
 * Composable for managing users (admin only)
 * Provides user listing, search, and admin role management
 */
export function useUsers() {
  const supabase = useSupabaseClient<Database>()
  const { t } = useI18n()
  const toast = useToast()

  const store = useUsersStore()
  const {
    users,
    currentUser,
    isLoading,
    error,
    filter,
    pagination,
    totalCount,
    totalPages,
  } = storeToRefs(store)

  const {
    setFilter: _setFilter,
    clearFilter: _clearFilter,
    setPage: _setPage,
    setCurrentUser: _setCurrentUser,
  } = store

  /**
   * Fetch all users with optional filtering
   * Optimized to avoid N+1 problem using nested count selection
   */
  async function fetchUsers(): Promise<UserWithStats[]> {
    store.setLoading(true)
    store.setError(null)

    try {
      // Build query with nested counts
      // Note: Relation names 'blogs' and 'posts' are assumed based on table names
      let query = supabase
        .from('users')
        .select('*, blogs(count), posts(count)', { count: 'exact' })

      // Apply admin filter
      if (filter.value.is_admin !== null && filter.value.is_admin !== undefined) {
        query = query.eq('is_admin', filter.value.is_admin)
      }

      // Apply search filter (server-side for username and full_name)
      if (filter.value.search) {
        const searchTerm = `%${filter.value.search}%`
        query = query.or(
          `username.ilike.${searchTerm},full_name.ilike.${searchTerm},email.ilike.${searchTerm}`
        )
      }

      // Apply pagination
      const from = (pagination.value.page - 1) * pagination.value.perPage
      const to = from + pagination.value.perPage - 1

      query = query.order('created_at', { ascending: false }).range(from, to)

      const { data, count, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Map response to UserWithStats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usersWithStats: UserWithStats[] = (data || []).map((user: any) => ({
        ...user,
        blogsCount: user.blogs?.[0]?.count || 0,
        postsCount: user.posts?.[0]?.count || 0,
      }))

      store.setUsers(usersWithStats)
      store.setTotalCount(count || 0)
      return usersWithStats
    } catch (err) {
      const message = formatError(err)
      store.setError(message)
      console.error('[useUsers] fetchUsers error:', err)
      toast.add({
        title: t('common.error'),
        description: t('errors.fetchUsersFailed'),
        color: 'error',
      })
      return []
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Fetch a single user by ID
   */
  async function fetchUser(userId: string): Promise<UserWithStats | null> {
    store.setLoading(true)
    store.setError(null)

    try {
      // Optimized single user fetch
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*, blogs(count), posts(count)')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = data as any
      const userWithStats: UserWithStats = {
        ...user,
        blogsCount: user.blogs?.[0]?.count || 0,
        postsCount: user.posts?.[0]?.count || 0,
      }

      store.setCurrentUser(userWithStats)
      return userWithStats
    } catch (err) {
      const message = formatError(err)
      store.setError(message)
      console.error('[useUsers] fetchUser error:', err)
      toast.add({
        title: t('common.error'),
        description: t('errors.fetchUserFailed'),
        color: 'error',
      })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Toggle admin status for a user
   */
  async function toggleAdminStatus(userId: string): Promise<boolean> {
    store.setLoading(true)
    store.setError(null)

    try {
      const user = users.value.find((u: UserWithStats) => u.id === userId)
      if (!user) {
        throw new Error(t('errors.userNotFound'))
      }

      const newIsAdmin = !user.is_admin
      const updateData: UserUpdate = {
        is_admin: newIsAdmin,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (updateError) throw updateError

      // Update local state without refetching
      const updatedUsers = users.value.map((u: UserWithStats) =>
        u.id === userId ? { ...u, is_admin: newIsAdmin } : u
      )
      store.setUsers(updatedUsers)

      toast.add({
        title: t('common.success'),
        description: newIsAdmin
          ? t('admin.adminGranted')
          : t('admin.adminRevoked'),
        color: 'success',
      })

      return true
    } catch (err) {
      const message = formatError(err)
      store.setError(message)
      console.error('[useUsers] toggleAdminStatus error:', err)
      toast.add({
        title: t('common.error'),
        description: t('errors.toggleAdminFailed'),
        color: 'error',
      })
      return false
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Update user profile
   */
  async function updateUser(userId: string, data: Partial<UserUpdate>): Promise<boolean> {
    store.setLoading(true)
    store.setError(null)

    try {
      const updateData: UserUpdate = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (updateError) throw updateError

      // Update local state
      const updatedUsers = users.value.map((u: UserWithStats) =>
        u.id === userId ? { ...u, ...data } : u
      )
      store.setUsers(updatedUsers)

      if (currentUser.value?.id === userId) {
        store.setCurrentUser({ ...currentUser.value, ...data })
      }

      toast.add({
        title: t('common.success'),
        description: t('admin.userUpdated'),
        color: 'success',
      })

      return true
    } catch (err) {
      const message = formatError(err)
      store.setError(message)
      console.error('[useUsers] updateUser error:', err)
      toast.add({
        title: t('common.error'),
        description: t('errors.updateUserFailed'),
        color: 'error',
      })
      return false
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Get display name for user
   */
  function getUserDisplayName(user: User | UserWithStats): string {
    return user.full_name || user.username || user.email || 'Unknown User'
  }

  /**
   * Get user initials for avatar fallback
   */
  function getUserInitials(user: User | UserWithStats): string {
    const name = user.full_name || user.username || user.email || ''
    const parts = name.split(' ')
    if (parts.length >= 2) {
      const first = parts[0]?.charAt(0) || ''
      const second = parts[1]?.charAt(0) || ''
      if (first && second) {
        return (first + second).toUpperCase()
      }
    }
    return name.slice(0, 2).toUpperCase()
  }

  function clearCurrentUser() {
    _setCurrentUser(null)
    store.setError(null)
  }

  return {
    // State
    users,
    currentUser,
    isLoading,
    error,
    filter,
    pagination,
    totalCount,
    totalPages,

    // Methods
    fetchUsers,
    fetchUser,
    toggleAdminStatus,
    updateUser,
    clearCurrentUser,

    // Store actions
    setFilter: _setFilter,
    clearFilter: _clearFilter,
    setPage: _setPage,

    // Helpers
    getUserDisplayName,
    getUserInitials,
  }
}
