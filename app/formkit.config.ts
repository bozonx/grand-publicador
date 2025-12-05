import { defineFormKitConfig } from '@formkit/vue'
import { generateClasses } from '@formkit/themes'
import { rootClasses } from './formkit.theme'
import { ru, en } from '@formkit/i18n'

export default defineFormKitConfig({
  config: {
    classes: generateClasses(rootClasses)
  },
  locales: { ru, en },
  locale: 'ru', // Default locale
})
