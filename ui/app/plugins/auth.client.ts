export default defineNuxtPlugin(async () => {
    const { authMode, loginWithDev, isAuthenticated, initialize } = useAuth()

    // Initialize auth state
    await initialize()

    // In dev mode, auto-login if not authenticated
    if (authMode.value === 'dev' && !isAuthenticated.value) {
        // eslint-disable-next-line no-console
        console.info('Dev mode: Attempting auto-login')
        try {
            await loginWithDev()
            // eslint-disable-next-line no-console
            console.info('Dev mode: Auto-login successful')
        } catch (e) {
            console.error('Dev mode: Auto-login failed', e)
        }
    }
})
