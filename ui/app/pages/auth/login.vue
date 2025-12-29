<script setup lang="ts">
import { nextTick } from 'vue'

const { t } = useI18n()
const { loginWithTelegram, loginWithTelegramWidget, loginWithDev, isLoading, error, isAuthenticated } = useAuth()
const config = useRuntimeConfig()
const router = useRouter()

const isDev = config.public.devMode === 'true'
const isTelegramContent = ref(true)
const widgetContainer = ref<HTMLElement | null>(null)

const onTelegramAuth = async (user: any) => {
  try {
    await loginWithTelegramWidget(user)
    router.push('/')
  } catch (e) {
    console.error("Widget login failed", e)
  }
}

const loadWidget = async () => {
  if (!process.client) return
  
  // A small delay often helps with Telegram widget rendering in SPAs
  await new Promise(resolve => setTimeout(resolve, 100))
  await nextTick()
  
  if (widgetContainer.value) {
    const botName = config.public.telegramBotName
    // eslint-disable-next-line no-console
    console.log("Loading Telegram widget for:", botName)
    
    // Clear container
    widgetContainer.value.innerHTML = ''
    
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botName as string)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true
    
    // @ts-ignore
    window.onTelegramAuth = onTelegramAuth
    
    widgetContainer.value.appendChild(script)
  }
}

// Watch for the DOM element directly
watch(widgetContainer, (el) => {
  if (el) {
    loadWidget()
  }
})

onMounted(async () => {
  // If already logged in, go to home
  if (isAuthenticated.value) {
    router.push('/')
    return
  }

  // @ts-ignore
  const tg = window.Telegram?.WebApp
  
  // @ts-ignore
  window.onTelegramAuth = onTelegramAuth

  if (tg?.initData) {
     try {
       await loginWithTelegram(tg.initData)
       router.push('/')
     } catch (e) {
       console.error("Mini App login failed", e)
       isTelegramContent.value = false
     }
  } else if (isDev) {
     try {
       await loginWithDev()
       router.push('/')
     } catch (e) {
       console.error("Dev login failed", e)
       isTelegramContent.value = false
     }
  } else {
    isTelegramContent.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      
      <!-- Logo/Title -->
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Grand Publicador</h1>
      </div>

      <!-- Loading State (visible while authenticating or loading widget) -->
      <div v-if="isLoading" class="flex flex-col items-center space-y-4">
        <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
        <p class="text-gray-600 dark:text-gray-400">{{ t('auth.loggingIn') || 'Authenticating...' }}</p>
      </div>

      <!-- Error Message -->
      <UAlert
        v-if="error"
        class="mb-6"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :title="t('common.error')"
        :description="String(error)"
      />

      <!-- Telegram Login Widget Container -->
      <div v-if="!isLoading && !isTelegramContent" class="space-y-6">
        <div class="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
           <!-- Only the official widget should be here -->
           <div class="flex flex-col items-center justify-center min-h-[100px]">
             <div ref="widgetContainer" class="telegram-widget-container"></div>
             
             <!-- Show a subtle hint only AFTER we attempt to load -->
             <p class="mt-8 text-sm text-gray-500 dark:text-gray-400">
               {{ t('auth.widgetHint') }}
             </p>
           </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.telegram-widget-container :deep(iframe) {
  margin: 0 auto !important;
}
</style>
