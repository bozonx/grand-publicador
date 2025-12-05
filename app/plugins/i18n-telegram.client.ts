/**
 * Plugin to detect language from Telegram WebApp
 * Priority:
 * 1. Telegram WebApp language_code
 * 2. Browser language (handled by i18n module)
 * 3. Default locale (ru)
 */
export default defineNuxtPlugin(() => {
  const { setLocale, locale, locales } = useI18n()
  
  // Get available locale codes
  const availableLocales = locales.value.map(l => 
    typeof l === 'string' ? l : l.code
  ) as string[]

  type SupportedLocale = 'ru' | 'en'

  /**
   * Normalize language code to supported locale
   * e.g., 'en-US' -> 'en', 'ru-RU' -> 'ru'
   */
  function normalizeLocale(langCode: string): SupportedLocale | null {
    // Direct match
    if (availableLocales.includes(langCode)) {
      return langCode as SupportedLocale
    }
    
    // Try base language (e.g., 'en-US' -> 'en')
    const baseLang = langCode.split('-')[0]
    if (baseLang && availableLocales.includes(baseLang)) {
      return baseLang as SupportedLocale
    }
    
    return null
  }

  /**
   * Get language from Telegram WebApp
   */
  function getTelegramLanguage(): SupportedLocale | null {
    if (typeof window === 'undefined') return null
    
    const tgWebApp = window.Telegram?.WebApp
    if (!tgWebApp) return null

    // Try initDataUnsafe.user.language_code first
    const userLang = tgWebApp.initDataUnsafe?.user?.language_code
    if (userLang) {
      return normalizeLocale(userLang)
    }

    return null
  }

  // Only run on client
  if (import.meta.client) {
    const telegramLang = getTelegramLanguage()
    
    if (telegramLang && telegramLang !== locale.value) {
      console.log(`[i18n] Setting locale from Telegram: ${telegramLang}`)
      setLocale(telegramLang)
    }
  }
})
