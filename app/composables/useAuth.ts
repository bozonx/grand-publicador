import type { TelegramWebAppUser } from '~/types/telegram'
import type { Database } from '~/types/database.types'

type User = Database['public']['Tables']['users']['Row']

interface AuthState {
  user: User | null
  telegramUser: TelegramWebAppUser | null
  isLoading: boolean
  error: string | null
}

const authState = reactive<AuthState>({
  user: null,
  telegramUser: null,
  isLoading: false,
  error: null,
})

/**
 * Authentication composable for Telegram Mini App
 * Handles both production (Telegram WebApp) and development (mock) modes
 */
export function useAuth() {
  const config = useRuntimeConfig()
  const supabase = useSupabaseClient<Database>()

  const isDevMode = computed(() => {
    return String(config.public.devMode) === 'true'
  })

  const isAuthenticated = computed(() => !!authState.user)
  const isAdmin = computed(() => authState.user?.is_admin === true)
  const currentUser = computed(() => authState.user)
  const telegramUser = computed(() => authState.telegramUser)

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
    if (authState.isLoading) {
      return authState.user
    }

    authState.isLoading = true
    authState.error = null

    try {
      const tgUser = getTelegramUser()

      if (!tgUser) {
        authState.error = 'Telegram user not found'
        return null
      }

      authState.telegramUser = tgUser

      // Call Supabase function to find or create user
      const { data, error } = await supabase.rpc('find_or_create_telegram_user', {
        p_telegram_id: tgUser.id,
        p_username: tgUser.username || undefined,
        p_first_name: tgUser.first_name || undefined,
        p_last_name: tgUser.last_name || undefined,
      })

      if (error) {
        console.error('[Auth] Failed to find/create user:', error)
        authState.error = error.message
        return null
      }

      authState.user = data as User
      console.log('[Auth] User authenticated:', authState.user.id)

      return authState.user
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Auth] Initialization error:', message)
      authState.error = message
      return null
    }
    finally {
      authState.isLoading = false
    }
  }

  /**
   * Refresh current user data from database
   */
  async function refreshUser(): Promise<User | null> {
    if (!authState.user?.id) {
      return null
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authState.user.id)
      .single()

    if (error) {
      console.error('[Auth] Failed to refresh user:', error)
      return null
    }

    authState.user = data
    return data
  }

  /**
   * Clear authentication state
   */
  function logout() {
    authState.user = null
    authState.telegramUser = null
    authState.error = null
  }

  /**
   * Get current user (alias for currentUser.value)
   */
  function getCurrentUser(): User | null {
    return authState.user
  }

  return {
    // State
    user: currentUser,
    telegramUser,
    isLoading: computed(() => authState.isLoading),
    error: computed(() => authState.error),

    // Computed
    isAuthenticated,
    isAdmin,
    isDevMode,

    // Methods
    initialize,
    refreshUser,
    logout,
    getCurrentUser,
    getTelegramUser,
  }
}
