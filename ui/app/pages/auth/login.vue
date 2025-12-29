<script setup lang="ts">
const { t } = useI18n()
const { loginWithTelegram, loginWithTelegramWidget, loginWithDev, isLoading, error } = useAuth()
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

onMounted(async () => {
  // @ts-ignore
  const tg = window.Telegram?.WebApp
  
  // @ts-ignore
  window.onTelegramAuth = onTelegramAuth

  // Check if running inside Telegram
  if (tg?.initData) {
     try {
       await loginWithTelegram(tg.initData)
       router.push('/')
     } catch (e) {
       console.error("Telegram login failed", e)
     }
  } else if (isDev) {
     console.log("Dev mode detected, attempting auto-login...")
     try {
       await loginWithDev()
       router.push('/')
     } catch (e) {
       console.error("Dev login failed", e)
       isTelegramContent.value = false
       loadWidget()
     }
  } else {
    isTelegramContent.value = false
    loadWidget()
  }
})

const loadWidget = () => {
  if (process.client && widgetContainer.value) {
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', config.public.telegramBotName as string)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true
    widgetContainer.value.appendChild(script)
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      
      <!-- Logo/Title -->
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Grand Publicador</h1>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center space-y-4">
        <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
        <p class="text-gray-600 dark:text-gray-400">{{ t('auth.loggingIn') || 'Authenticating...' }}</p>
      </div>

      <!-- Error Message -->
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :title="t('common.error')"
        :description="String(error)"
      />

      <!-- Telegram Login Widget -->
      <div v-if="!isLoading && !isTelegramContent" class="space-y-6">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
           <UIcon name="i-logos-telegram" class="w-16 h-16 mx-auto mb-6" />
           <h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
             {{ t('auth.signInWithTelegram') }}
           </h2>
           
           <div class="flex justify-center min-h-[40px]">
             <div ref="widgetContainer"></div>
           </div>

           <p class="mt-6 text-sm text-gray-500 dark:text-gray-400">
             {{ t('auth.widgetHint') }}
           </p>
        </div>
      </div>

    </div>
  </div>
</template>
