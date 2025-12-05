import type { Database } from '~/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type UserUpdate = Database['public']['Tables']['users']['Update']

/**
 * Extended user type with additional computed fields
 */
export interface UserWithStats extends User {
  blogsCount?: number
  postsCount?: number
}

/**
 * Filter options for users list
 */
export interface UsersFilter {
  is_admin?: boolean | null
  search?: string
}

/**
 * Pagination options
 */
export interface UsersPaginationOptions {
  page: number
  perPage: number
}

/**
 * Composable for managing users (admin only)
 * Provides user listing, search, and admin role management
 */
export function useUsers() {
  const supabase = useSupabaseClient<Database>()
  const { t } = useI18n()
  const toast = useToast()

  const users = shallowRef<UserWithStats[]>([])
  const currentUser = shallowRef<UserWithStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filter = ref<UsersFilter>({})
  const pagination = ref<UsersPaginationOptions>({ page: 1, perPage: 20 })
  const totalCount = ref(0)

  /**
   * Get total pages count
   */
  const totalPages = computed(() =>
    Math.ceil(totalCount.value / pagination.value.perPage)
  )

  /**
   * Fetch all users with optional filtering
   */
  async function fetchUsers(): Promise<UserWithStats[]> {
    isLoading.value = true
    error.value = null

    try {
      // Build query
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })

      // Apply admin filter
      if (filter.value.is_admin !== null && filter.value.is_admin !== undefined) {
        query = query.eq('is_admin', filter.value.is_admin)
      }

      // Apply search filter (server-side for username and full_name)
      if (filter.value.search) {
        const searchTerm = `%${filter.value.search}%`
        query = query.or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      }

      // Apply pagination
      const from = (pagination.value.page - 1) * pagination.value.perPage
      const to = from + pagination.value.perPage - 1

      query = query
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data, count, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Get stats for each user (blogs and posts count)
      const usersWithStats: UserWithStats[] = await Promise.all(
        (data || []).map(async (user) => {
          // Get blogs count where user is owner
          const { count: blogsCount } = await supabase
            .from('blogs')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', user.id)

          // Get posts count where user is author
          const { count: postsCount } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('author_id', user.id)

          return {
            ...user,
            blogsCount: blogsCount || 0,
            postsCount: postsCount || 0
          }
        })
      )

      users.value = usersWithStats
      totalCount.value = count || 0
      return usersWithStats
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users'
      error.value = message
      console.error('[useUsers] fetchUsers error:', err)
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single user by ID
   */
  async function fetchUser(userId: string): Promise<UserWithStats | null> {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError

      // Get stats
      const { count: blogsCount } = await supabase
        .from('blogs')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)

      const { count: postsCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', userId)

      const userWithStats: UserWithStats = {
        ...data,
        blogsCount: blogsCount || 0,
        postsCount: postsCount || 0
      }

      currentUser.value = userWithStats
      return userWithStats
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user'
      error.value = message
      console.error('[useUsers] fetchUser error:', err)
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Toggle admin status for a user
   */
  async function toggleAdminStatus(userId: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      // Get current admin status
      const user = users.value.find(u => u.id === userId)
      if (!user) {
        throw new Error('User not found')
      }

      const newIsAdmin = !user.is_admin

      const updateData: UserUpdate = {
        is_admin: newIsAdmin,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (updateError) throw updateError

      // Update local state
      const index = users.value.findIndex(u => u.id === userId)
      if (index !== -1) {
        const existingUser = users.value[index]
        if (existingUser) {
          const updated = [...users.value]
          updated[index] = { ...existingUser, is_admin: newIsAdmin } as UserWithStats
          users.value = updated
        }
      }

      toast.add({
        title: t('common.success'),
        description: newIsAdmin 
          ? t('admin.adminGranted', 'Admin rights granted') 
          : t('admin.adminRevoked', 'Admin rights revoked'),
        color: 'success'
      })

      return true
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user'
      error.value = message
      console.error('[useUsers] toggleAdminStatus error:', err)
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
   * Update user profile
   */
  async function updateUser(userId: string, data: Partial<UserUpdate>): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const updateData: UserUpdate = {
        ...data,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (updateError) throw updateError

      // Update local state
      const index = users.value.findIndex(u => u.id === userId)
      if (index !== -1) {
        const existingUser = users.value[index]
        if (existingUser) {
          const updated = [...users.value]
          updated[index] = { ...existingUser, ...data } as UserWithStats
          users.value = updated
        }
      }

      if (currentUser.value?.id === userId) {
        currentUser.value = { ...currentUser.value, ...data }
      }

      toast.add({
        title: t('common.success'),
        description: t('admin.userUpdated', 'User updated successfully'),
        color: 'success'
      })

      return true
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user'
      error.value = message
      console.error('[useUsers] updateUser error:', err)
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
  function setFilter(newFilter: UsersFilter) {
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
   * Clear current user state
   */
  function clearCurrentUser() {
    currentUser.value = null
    error.value = null
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

    // Filter and pagination
    setFilter,
    clearFilter,
    setPage,

    // Helpers
    getUserDisplayName,
    getUserInitials
  }
}
