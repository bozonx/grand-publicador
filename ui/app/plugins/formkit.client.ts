import { defineNuxtPlugin } from '#app'

/**
 * FormKit client plugin
 * Handles locale synchronization with i18n
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Access i18n from nuxtApp context to avoid injection errors
  const modules = import.meta.glob('../../../node_modules/@formkit/i18n/dist/*.mjs')


  // Access i18n from nuxtApp context
  // @ts-ignore - nuxt-i18n types might not be perfectly inferred
  const i18n = nuxtApp.$i18n

  if (!i18n) return;

  // Watch for locale changes and update FormKit config
  watch(
    () => (i18n as any).locale?.value,
    (newLocale) => {
      const formkit = nuxtApp.vueApp.config.globalProperties.$formkit as any
      if (formkit && formkit.config) {
        // Update locale directly in global config
        formkit.config.locale = newLocale
      }
    },
    { immediate: true }
  )
})
