// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  i18n: {
    locales: [
      { code: 'ru', name: 'Русский', file: 'ru.json', iso: 'ru-RU' },
      { code: 'en', name: 'English', file: 'en.json', iso: 'en-US' },
    ],
    defaultLocale: 'ru',
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'ru',
      redirectOn: 'root',
      alwaysRedirect: false,
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  css: ['~/assets/css/main.css'],

  ssr: false,

  app: {
    head: {
      title: 'Grand Publicador',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      meta: [{ name: 'theme-color', content: '#000000' }],
    },
  },

  experimental: {
    viewTransition: true,
  },

  runtimeConfig: {
    public: {
      devMode: process.env.VITE_DEV_MODE || 'false',
      devTelegramId: process.env.VITE_DEV_TELEGRAM_ID || '',
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '',
    },
  },



  devtools: { enabled: true }
})
