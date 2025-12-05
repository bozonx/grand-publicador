import type { TelegramWebAppUser } from '~/types/telegram'
import type { Database } from '~/types/database.types'

type User = Database['public']['Tables']['users']['Row']

/**
 * Auth store using Pinia Setup Store syntax for better TypeScript support
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const telegramUser = ref<TelegramWebAppUser | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.is_admin === true)
  const userId = computed(() => user.value?.id ?? null)
  const telegramId = computed(() => user.value?.telegram_id ?? null)
  const displayName = computed(() => {
    if (user.value?.full_name) {
      return user.value.full_name
    }
    if (telegramUser.value) {
      const { first_name, last_name } = telegramUser.value
      return [first_name, last_name].filter(Boolean).join(' ')
    }
    return 'User'
  })

  // Actions
  function setUser(newUser: User | null) {
    user.value = newUser
  }

  function setTelegramUser(newTelegramUser: TelegramWebAppUser | null) {
    telegramUser.value = newTelegramUser
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setInitialized(initialized: boolean) {
    isInitialized.value = initialized
  }

  function setError(err: string | null) {
    error.value = err
  }

  function reset() {
    user.value = null
    telegramUser.value = null
    isLoading.value = false
    isInitialized.value = false
    error.value = null
  }

  return {
    // State
    user,
    telegramUser,
    isLoading,
    isInitialized,
    error,

    // Getters
    isAuthenticated,
    isAdmin,
    userId,
    telegramId,
    displayName,

    // Actions
    setUser,
    setTelegramUser,
    setLoading,
    setInitialized,
    setError,
    reset,
  }
})
