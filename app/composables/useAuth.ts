import type { TelegramWebAppUser } from '~/types/telegram'
import type { Database } from '~/types/database.types'
import { useAuthStore } from '~/stores/auth'

type User = Database['public']['Tables']['users']['Row']

/**
 * Authentication composable for Telegram Mini App
 * Handles both production (Telegram WebApp) and development (mock) modes
 * Uses Pinia store for state management
 */
export function useAuth() {
  const config = useRuntimeConfig()
  const supabase = useSupabaseClient<Database>()
  const authStore = useAuthStore()

  const isDevMode = computed(() => {
    return String(config.public.devMode) === 'true'
  })

  // Computed from store
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isAdmin = computed(() => authStore.isAdmin)
  const currentUser = computed(() => authStore.user)
  const telegramUser = computed(() => authStore.telegramUser)

  /**
   * Get Telegram user data from WebApp or dev environment
   */
  function getTelegramUser(): TelegramWebAppUser | null {
    // Dev mode: use mock telegram ID from env
    if (isDevMode.value) {
      const devTelegramId = config.public.devTelegramId
      if (devTelegramId) {
        return {
          id: Number(devTelegramId),
          first_name: 'Dev',
          last_name: 'User',
          username: 'dev_user',
        }
      }
      console.warn('[Auth] Dev mode enabled but VITE_DEV_TELEGRAM_ID not set')
      return null
    }

    // Production: get user from Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      return window.Telegram.WebApp.initDataUnsafe.user
    }

    return null
  }

  /**
   * Initialize authentication
   * Fetches or creates user based on Telegram ID
   */
  async function initialize(): Promise<User | null> {
    if (authStore.isLoading || authStore.isInitialized) {
      return authStore.user
    }

    authStore.setLoading(true)
    authStore.setError(null)

    try {
      const tgUser = getTelegramUser()

      if (!tgUser) {
        authStore.setError('Telegram user not found')
        return null
      }

      authStore.setTelegramUser(tgUser)

      // Call Supabase function to find or create user
      const { data, error } = await supabase.rpc('find_or_create_telegram_user', {
        p_telegram_id: tgUser.id,
        p_username: tgUser.username || undefined,
        p_first_name: tgUser.first_name || undefined,
        p_last_name: tgUser.last_name || undefined,
      })

      if (error) {
        console.error('[Auth] Failed to find/create user:', error)
        authStore.setError(error.message)
        return null
      }

      authStore.setUser(data as User)
      authStore.setInitialized(true)
      console.log('[Auth] User authenticated:', authStore.user?.id)

      return authStore.user
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Auth] Initialization error:', message)
      authStore.setError(message)
      return null
    }
    finally {
      authStore.setLoading(false)
    }
  }

  /**
   * Refresh current user data from database
   */
  async function refreshUser(): Promise<User | null> {
    if (!authStore.user?.id) {
      return null
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authStore.user.id)
      .single()

    if (error) {
      console.error('[Auth] Failed to refresh user:', error)
      return null
    }

    authStore.setUser(data)
    return data
  }

  /**
   * Clear authentication state
   */
  function logout() {
    authStore.reset()
  }

  /**
   * Get current user (alias for currentUser.value)
   */
  function getCurrentUser(): User | null {
    return authStore.user
  }

  return {
    // State
    user: currentUser,
    telegramUser,
    isLoading: computed(() => authStore.isLoading),
    error: computed(() => authStore.error),
    isInitialized: computed(() => authStore.isInitialized),

    // Computed
    isAuthenticated,
    isAdmin,
    isDevMode,
    displayName: computed(() => authStore.displayName),

    // Methods
    initialize,
    refreshUser,
    logout,
    getCurrentUser,
    getTelegramUser,
  }
}
