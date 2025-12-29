import { computed } from 'vue';

export const useAuth = () => {
    const authStore = useAuthStore();
    const config = useRuntimeConfig();

    return {
        user: computed(() => authStore.user),
        isLoading: computed(() => authStore.isLoading),
        isInitialized: computed(() => authStore.isInitialized),
        error: computed(() => authStore.error),
        isAuthenticated: computed(() => authStore.isLoggedIn),
        isAdmin: computed(() => authStore.isAdmin),
        displayName: computed(() => authStore.displayName),
        authMode: computed(() => (config.public.devMode === 'true' ? 'dev' : 'telegram')),

        loginWithTelegram: authStore.loginWithTelegram,
        signOut: authStore.logout,
        refreshUser: authStore.fetchMe,
        initialize: authStore.fetchMe,
    };
};
