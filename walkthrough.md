# Walkthrough: Migration to NestJS & Nuxt 4

## Overview
This document details the migration of "Grand Publicador" from a Nuxt-only (likely Supabase-heavy) architecture to a more robust and scalable NestJS backend and Nuxt 4 frontend.

## Backend Achievements (NestJS + Fastify)
1.  **Modular Architecture**: Each feature (Blogs, Channels, Posts, Auth, Users) is now a dedicated NestJS module.
2.  **Stateless Auth**: JWT-based authentication integrated with Telegram's WebApp security model.
3.  **Database Layer**: Prisma ORM with SQLite provides type safety and easy migrations.
4.  **Single Entry Point**: The NestJS server now hosts the Nuxt SPA, serving static files and handling API requests under `/api/v1`.
5.  **Graceful Error Handling**: A global exception filter handles API errors and ensures SPA navigation works by falling back to `index.html` for 404s.

## Frontend Achievements (Nuxt 4)
1.  **Modern Core**: Nuxt 4 with `future` compatibility enabled.
2.  **Pinia State Management**: Centralized stores for auth and blogs.
3.  **Typed API Access**: `useApi` composable provides a clean interface for backend communication with auto-token injection.
4.  **Premium UI Components**: Leveraged Nuxt UI (v3/4 features) for a modern, sleek interface.
5.  **Multi-language Support**: Fully integrated i18n with English and Russian locales.

## Key Technical Decisions
- **ESM Everything**: Both backend and frontend use ECMAScript Modules for better compatibility with modern packages.
- **CamelCase API**: Standardized API response field names to camelCase for consistency with TypeScript and NestJS practices.
- **Fastify over Express**: Used Fastify for the NestJS underlying engine for better performance.
- **SQLite for Simplicity**: Kept the database simple for now, but ready to scale to PostgreSQL if needed via Prisma.

## How to proceed
- Check `.env` for `JWT_SECRET` and `TELEGRAM_BOT_TOKEN`.
- Run `npm run build` in both root and `ui` directories.
- Start the server using `node dist/src/main.js`.
