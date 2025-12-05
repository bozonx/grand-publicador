/**
 * Database types
 * 
 * Этот файл будет автоматически сгенерирован из схемы Supabase на Шаге 4.
 * Пока используем placeholder типы.
 * 
 * Команда для генерации типов:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > app/types/database.types.ts
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            // Таблицы будут добавлены после создания схемы БД
            [key: string]: any
        }
        Views: {
            [key: string]: any
        }
        Functions: {
            [key: string]: any
        }
        Enums: {
            [key: string]: any
        }
    }
}
