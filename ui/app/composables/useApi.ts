export const useApi = () => {
    const config = useRuntimeConfig();
    const token = useCookie('auth_token');

    // Base path for API, matching NestJS global prefix
    const apiBase = `${config.public.apiBase}/api/v1`;

    const request = async <T>(url: string, options: any = {}) => {
        const headers = {
            ...options.headers,
        };

        if (token.value) {
            headers.Authorization = `Bearer ${token.value}`;
        }

        try {
            return await $fetch<T>(`${apiBase}${url}`, {
                ...options,
                headers,
            });
        } catch (error: any) {
            if (error.response?.status === 401) {
                // Handle unauthorized (clear token, etc.)
                token.value = null;
            }
            throw error;
        }
    };

    return {
        get: <T>(url: string, options: any = {}) => request<T>(url, { ...options, method: 'GET' }),
        post: <T>(url: string, body?: any, options: any = {}) => request<T>(url, { ...options, method: 'POST', body }),
        patch: <T>(url: string, body?: any, options: any = {}) => request<T>(url, { ...options, method: 'PATCH', body }),
        delete: <T>(url: string, options: any = {}) => request<T>(url, { ...options, method: 'DELETE' }),
    };
};
