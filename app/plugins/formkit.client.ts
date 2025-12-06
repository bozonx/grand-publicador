import { defineNuxtPlugin } from '#app'

/**
 * FormKit client plugin
 * Handles locale synchronization with i18n
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { locale } = useI18n()

  // Watch for locale changes and update FormKit config
  watch(
    () => locale.value,
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
