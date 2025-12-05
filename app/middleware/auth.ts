/**
 * Authentication middleware
 * Protects routes that require authentication
 */
export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, initialize, isLoading } = useAuth()

  // Wait for auth initialization if still loading
  if (isLoading.value) {
    return
  }

  // If not authenticated, try to initialize
  if (!isAuthenticated.value) {
    const user = await initialize()

    if (!user) {
      // Redirect to error page or show message
      return abortNavigation({
        statusCode: 401,
        message: 'Authentication required',
      })
    }
  }
})
