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

    const isLoggedIn = computed(() => !!user.value);

    async function loginWithTelegram(initData: string) {
        try {
            const response = await api.post<{ access_token: string, user: User }>('/auth/telegram', {
                initData,
            });

            token.value = response.access_token;
            user.value = response.user;

            return response;
        } catch (error) {
            console.error('Login failed', error);
            throw error;
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
            // Assuming a /auth/me endpoint exists or similar
            // For now, we'll just keep the user if we have a token (simplified)
            // In a real app, you'd verify the token with the backend
        } catch (error) {
            logout();
        }
    }

    return {
        user,
        isLoggedIn,
        loginWithTelegram,
        logout,
        fetchMe,
    };
});
