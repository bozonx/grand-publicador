# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Hybrid Authentication System**
  - Telegram Mini App authentication (automatic login via `telegram_id`)
  - Browser authentication via Supabase Auth (email/password, OAuth)
  - Development mode with mock Telegram user (`VITE_DEV_TELEGRAM_ID`)
  - Auto-detection of auth mode (Telegram → Browser → Dev)

- **Database Schema Improvements**
  - Added `admin` role to `blog_role` enum
  - Expanded `social_media_enum` with all platforms (youtube, tiktok, x, facebook, site)
  - Fixed `post_type_enum` values (post, article, news, video, short)
  - Posts now reference `channel_id` instead of `blog_id`
  - Added `username` field to users table
  - Made `email` optional for Telegram-only users
  - Removed FK constraint on `users.id` to support hybrid auth

- **RLS Policies**
  - Complete RLS policies for all tables
  - Posts: SELECT/INSERT/UPDATE/DELETE based on blog membership and roles
  - Blog Members: INSERT/UPDATE/DELETE for owners and admins
  - Channels: INSERT/UPDATE/DELETE based on roles

- **i18n with Auto Language Detection**
  - Russian and English locales
  - Auto-detect language from Telegram WebApp `language_code`
  - Fallback to browser language
  - Language switcher component

- **Auth Pages**
  - `/auth/login` - Sign in page with email/password and OAuth
  - `/auth/register` - Registration page
  - Auth layout with language switcher

- **Layouts and Navigation (Step 8)**
  - `default.vue` layout with Header and responsive Sidebar navigation
  - `auth.vue` layout for authentication pages
  - `LayoutHeader.vue` component with user menu, language switcher, and mobile menu toggle
  - `LayoutNavigation.vue` component with main navigation links
  - Responsive mobile sidebar with overlay
  - Admin-only navigation items (hidden for non-admin users)
  - Admin middleware for protecting admin routes

- **Pages**
  - Dashboard (`/`) - Welcome page with quick actions
  - Blogs list (`/blogs`) - Placeholder for blogs management
  - Settings (`/settings`) - User profile and settings
  - Admin Users (`/admin/users`) - Placeholder for user management (admin only)

- **Database Functions**
  - `find_or_create_telegram_user` - Creates or updates user from Telegram data
  - `handle_new_auth_user` trigger - Auto-creates public.users record on Supabase Auth signup

### Changed
- Updated `@tma.js/sdk-vue` (note: `@telegram-apps/sdk-vue` is deprecated)
- Renamed `channels.platform` to `channels.social_media`
- Renamed `channels.identifier` to `channels.channel_identifier`
- Removed `slug` from blogs table

### Fixed
- Fixed FK constraint violation in `find_or_create_telegram_user`
- Fixed i18n locale path configuration for Nuxt 4

## [0.1.0] - 2025-12-05

### Added
- Initial project setup with Nuxt 4
- TailwindCSS and @nuxt/ui integration
- Supabase setup (local development)
- Initial database schema
- Pinia state management
- Basic UI components
