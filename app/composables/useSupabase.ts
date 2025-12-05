/**
 * Composable для работы с Supabase клиентом
 * Предоставляет типизированный доступ к Supabase функциям
 */
export const useSupabase = () => {
    const supabaseClient = useSupabaseClient()
    const user = useSupabaseUser()

    return {
        client: supabaseClient,
        user,
        auth: supabaseClient.auth,
        from: supabaseClient.from.bind(supabaseClient),
    }
}
