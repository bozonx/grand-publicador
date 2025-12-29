import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

interface User {
    id: string;
    telegramId?: string;
    username?: string;
    fullName?: string;
    avatarUrl?: string;
    isAdmin: boolean;
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const token = useCookie('auth_token');
    const api = useApi();

    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const isInitialized = ref(false);

    const isLoggedIn = computed(() => !!user.value);
    const isAdmin = computed(() => user.value?.isAdmin === true);
    const displayName = computed(() => {
        if (user.value?.fullName) return user.value.fullName;
        if (user.value?.username) return user.value.username;
        return 'User';
    });

    async function loginWithTelegram(initData: string) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.post<{ access_token: string, user: User }>('/auth/telegram', {
                initData,
            });

            token.value = response.access_token;
            user.value = response.user;
            isInitialized.value = true;

            return response;
        } catch (err: any) {
            error.value = err.message;
            console.error('Login failed', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function logout() {
        user.value = null;
        token.value = null;
        navigateTo('/login');
    }

    async function fetchMe() {
        if (!token.value) return;

        try {
            // In a real app, verify the token
        } catch (err) {
            logout();
        }
    }

    return {
        user,
        isLoading,
        isInitialized,
        error,
        isLoggedIn,
        isAdmin,
        displayName,
        loginWithTelegram,
        logout,
        fetchMe,
    };
});
