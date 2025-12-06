import { defineNuxtPlugin } from '#app'

/**
 * FormKit client plugin
 * Handles locale synchronization with i18n
 * For MVP, the initial locale from config is sufficient
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Watch for locale changes and update FormKit if supported
  // For FormKit 1.x, dynamic locale switching may require additional setup
  if (nuxtApp.vueApp.config.globalProperties.$formkit) {
    // FormKit config is available - dynamic locale switching could be added here
  }
})
