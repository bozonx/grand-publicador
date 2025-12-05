// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@formkit/nuxt',
  ],

  i18n: {
    locales: [
      { code: 'ru', name: 'Русский', file: 'ru.json', iso: 'ru-RU' },
      { code: 'en', name: 'English', file: 'en.json', iso: 'en-US' },
    ],
    defaultLocale: 'ru',
    // Path to locale files (i18n module looks in i18n/locales by default)
    langDir: 'locales',
    // URL without language prefix for Mini App
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'ru',
      // Redirect only on first visit, then use cookie
      redirectOn: 'root',
      // Detect from browser Accept-Language header
      alwaysRedirect: false,
    },
  },

  css: [
    '~/assets/css/main.css',
  ],

  supabase: {
    redirect: false, // Отключаем редирект, т.к. auth через Telegram
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  app: {
    head: {
      title: 'Grand Publicador',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      meta: [
        { name: 'theme-color', content: '#000000' },
      ],
    },
  },

  experimental: {
    viewTransition: true, // Smooth transitions
  },

  runtimeConfig: {
    public: {
      devMode: process.env.VITE_DEV_MODE || 'false',
      devTelegramId: process.env.VITE_DEV_TELEGRAM_ID || '',
      appName: process.env.VITE_APP_NAME || 'Grand Publicador',
    },
  },
})
