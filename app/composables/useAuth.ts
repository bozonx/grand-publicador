import type { TelegramWebAppUser } from '~/types/telegram'
import type { Database } from '~/types/database.types'
import { useAuthStore } from '~/stores/auth'

type User = Database['public']['Tables']['users']['Row']
type AuthMode = 'telegram' | 'browser' | 'dev'

/**
 * Hybrid authentication composable
 * Supports:
 * - Telegram Mini App authentication
 * - Browser authentication via Supabase Auth (email/password, OAuth)
 * - Development mode with mock Telegram user
 */
export function useAuth() {
  const config = useRuntimeConfig()
  const supabase = useSupabaseClient<Database>()
  const supabaseUser = useSupabaseUser()
  const authStore = useAuthStore()

  const isDevMode = computed(() => {
    return String(config.public.devMode) === 'true'
  })

  // Detect if running inside Telegram WebApp
  const isTelegramWebApp = computed(() => {
    if (import.meta.server) return false
    return !!window.Telegram?.WebApp?.initDataUnsafe?.user
  })

  // Determine auth mode
  const authMode = computed<AuthMode>(() => {
    if (isDevMode.value) return 'dev'
    if (isTelegramWebApp.value) return 'telegram'
    return 'browser'
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
      return null
    }

    // Production: get user from Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      return window.Telegram.WebApp.initDataUnsafe.user
    }

    return null
  }

  /**
   * Initialize Telegram authentication
   * Creates or finds user based on Telegram ID
   */
  async function initializeTelegram(): Promise<User | null> {
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
      console.error('[Auth] Failed to find/create Telegram user:', error)
      authStore.setError(error.message)
      return null
    }

    authStore.setUser(data as User)
    console.log('[Auth] Telegram user authenticated:', authStore.user?.id)
    return authStore.user
  }

  /**
   * Initialize browser authentication
   * Uses Supabase Auth session
   */
  async function initializeBrowser(): Promise<User | null> {
    // Wait for Supabase auth to be ready
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      // Not authenticated via browser
      return null
    }

    // Fetch user from public.users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('[Auth] Failed to fetch browser user:', error)
      authStore.setError(error.message)
      return null
    }

    authStore.setUser(data)
    console.log('[Auth] Browser user authenticated:', authStore.user?.id)
    return authStore.user
  }

  /**
   * Initialize authentication based on detected mode
   */
  async function initialize(): Promise<User | null> {
    if (authStore.isLoading || authStore.isInitialized) {
      return authStore.user
    }

    authStore.setLoading(true)
    authStore.setError(null)

    try {
      let user: User | null = null

      switch (authMode.value) {
        case 'dev':
        case 'telegram':
          user = await initializeTelegram()
          break
        case 'browser':
          user = await initializeBrowser()
          break
      }

      authStore.setInitialized(true)
      return user
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Auth] Initialization error:', message)
      authStore.setError(message)
      return null
    } finally {
      authStore.setLoading(false)
    }
  }

  /**
   * Sign in with email and password (browser mode)
   */
  async function signInWithEmail(email: string, password: string): Promise<User | null> {
    authStore.setLoading(true)
    authStore.setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        authStore.setError(error.message)
        return null
      }

      if (data.user) {
        return await initializeBrowser()
      }

      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      authStore.setError(message)
      return null
    } finally {
      authStore.setLoading(false)
    }
  }

  /**
   * Sign up with email and password (browser mode)
   */
  async function signUpWithEmail(
    email: string,
    password: string,
    fullName?: string
  ): Promise<User | null> {
    authStore.setLoading(true)
    authStore.setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        authStore.setError(error.message)
        return null
      }

      if (data.user) {
        // User created, trigger will create public.users record
        return await initializeBrowser()
      }

      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      authStore.setError(message)
      return null
    } finally {
      authStore.setLoading(false)
    }
  }

  /**
   * Sign in with OAuth provider (browser mode)
   */
  async function signInWithOAuth(provider: 'google' | 'github'): Promise<void> {
    authStore.setLoading(true)
    authStore.setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        authStore.setError(error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      authStore.setError(message)
    } finally {
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
   * Sign out (browser mode)
   */
  async function signOut(): Promise<void> {
    if (authMode.value === 'browser') {
      await supabase.auth.signOut()
    }
    authStore.reset()
  }

  /**
   * Get current user (alias for currentUser.value)
   */
  function getCurrentUser(): User | null {
    return authStore.user
  }

  // Watch for Supabase auth state changes (browser mode)
  if (import.meta.client) {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (authMode.value !== 'browser') return

      if (event === 'SIGNED_IN' && session?.user) {
        await initializeBrowser()
      } else if (event === 'SIGNED_OUT') {
        authStore.reset()
      }
    })
  }

  return {
    // State
    user: currentUser,
    telegramUser,
    supabaseUser,
    isLoading: computed(() => authStore.isLoading),
    error: computed(() => authStore.error),
    isInitialized: computed(() => authStore.isInitialized),

    // Computed
    isAuthenticated,
    isAdmin,
    isDevMode,
    isTelegramWebApp,
    authMode,
    displayName: computed(() => authStore.displayName),

    // Methods
    initialize,
    refreshUser,
    signOut,
    getCurrentUser,
    getTelegramUser,

    // Browser auth methods
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
  }
}
