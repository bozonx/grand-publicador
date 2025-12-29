/**
 * Authentication middleware
 * Protects routes that require authentication
 * Supports hybrid auth: Telegram + Browser
 */
export default defineNuxtRouteMiddleware(async (_to) => {
  const { isAuthenticated, initialize, isLoading, authMode } = useAuth()

  // Wait for auth initialization if still loading
  if (isLoading.value) {
    return
  }

  // If not authenticated, try to initialize
  if (!isAuthenticated.value) {
    const user = await initialize()

    if (!user) {
      // For browser mode, redirect to login page
      if (authMode.value === 'browser') {
        return navigateTo('/auth/login', {
          redirectCode: 302,
          replace: true,
        })
      }

      // For Telegram/dev mode, show error
      return abortNavigation({
        statusCode: 401,
        message: 'Authentication required',
      })
    }
  }
})
