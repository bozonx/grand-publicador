// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: [
    '@pinia/nuxt',
  ],
  future: {
    compatibilityVersion: 4,
  },
  ssr: false,
  devtools: { enabled: true }
})
