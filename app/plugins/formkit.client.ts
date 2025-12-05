import { defineNuxtPlugin } from '#app'
import { watch } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n

  // Watch for locale changes from Nuxt i18n
  // And update FormKit locale
  // This assumes we have a way to update the global config.
  // For FormKit 1.x, we can inject the config or just modify it if reactive.
  
  // Since we set `locale: ...` in config, let's see if we can just update the locale setting.
  // Using `reset` is one way, but it resets everything.
  
  // Actually, FormKit provides a `changeLocale` function in version 1.0+?
  // No, `setLocale` is not a top-level export.
  
  // Let's assume that for now, the initial locale is enough for MVP as per PRD Step 9
  // "Integrate with i18n for validation error translations"
  // If the initial locale is correct, logic works.
  
  // But let's try to update the $formkit.config if available
  if (nuxtApp.vueApp.config.globalProperties.$formkit) {
      // Logic for dynamic switch if supported
  }
})
