<script setup lang="ts">
const { t } = useI18n()
const { loginWithTelegram, loginWithDev, isLoading, error } = useAuth()
const config = useRuntimeConfig()
const router = useRouter()

const isDev = config.public.devMode === 'true'
const isTelegramContent = ref(true)

onMounted(async () => {
  // @ts-ignore
  const tg = window.Telegram?.WebApp
  
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
       // If dev login fails, we stay on page to show error
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
        :description="error"
      />

      <!-- Not in Telegram Message -->
      <div v-if="!isLoading && !isTelegramContent && !error" class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <UIcon name="i-logos-telegram" class="w-16 h-16 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {{ t('auth.telegramOnly') || 'Telegram Only' }}
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          {{ t('auth.openInTelegramApp') || 'Please open this application using the Telegram app.' }}
        </p>
      </div>

    </div>
  </div>
</template>
