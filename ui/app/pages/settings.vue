<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t, locale, setLocale, availableLocales } = useI18n()
const { user, displayName, authMode, refreshUser } = useAuth()
const toast = useToast()
const colorMode = useColorMode()

const api = useApi()
const isSyncing = ref(false)

// Language options
const languageOptions = computed(() =>
  availableLocales.map((loc: string) => ({
    value: loc,
    label: loc === 'ru' ? 'Русский' : 'English',
  }))
)

/**
 * Sync name from Telegram or fallbacks and update in backend
 */
async function syncName() {
  isSyncing.value = true
  
  try {
    let nameToSave = ''
    let avatarToSave = ''

    // Try to get from Telegram WebApp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user
    
    if (tgUser) {
      const first = tgUser.first_name || ''
      const last = tgUser.last_name || ''
      const full = [first, last].filter(Boolean).join(' ')
      if (full) {
        nameToSave = full
      } else if (tgUser.username) {
        nameToSave = tgUser.username
      }
      
      if (tgUser.photo_url) {
        avatarToSave = tgUser.photo_url
      }
    }
    
    // Fallback if no Telegram WebApp data found (dev mode or just missing)
    if (!nameToSave) {
      // Fallback to existing username
      if (user.value?.telegramUsername) {
        nameToSave = user.value.telegramUsername
      } 
      // Fallback to ID
      else if (user.value?.id) {
        nameToSave = user.value.id
      }
    }

    if (!nameToSave) {
        toast.add({
            title: t('common.warning'),
            description: t('settings.noNameFound', 'Could not determine name from Telegram'),
            color: 'warning',
        })
        return
    }

    // Call API to update profile
    await api.patch('/users/me', { 
        fullName: nameToSave,
        ...(avatarToSave && { avatarUrl: avatarToSave })
    })
    
    // Refresh user data locally
    await refreshUser()
    
    toast.add({
      title: t('common.success'),
      description: t('settings.syncedSuccess', 'Profile synced with Telegram'),
      color: 'success',
    })
  } catch (err) {
    console.error('Failed to sync name:', err)
    toast.add({
      title: t('common.error'),
      description: t('settings.syncError', 'Failed to sync name'),
      color: 'error',
    })
  } finally {
    isSyncing.value = false
  }
}

/**
 * Change language
 */
function changeLanguage(newLocale: string) {
  setLocale(newLocale as 'ru' | 'en')
  // Save to localStorage for persistence
  localStorage.setItem('locale', newLocale)
  toast.add({
    title: t('common.success'),
    description: t('settings.languageChanged', 'Language changed'),
    color: 'success',
  })
}

// Format date helper
function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('settings.title') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ t('settings.account') }}
      </p>
    </div>

    <!-- Profile section -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ t('auth.profile') }}
        </h2>
      </template>
      
      <!-- Avatar and basic info -->
      <div class="flex items-start gap-4 mb-6">
        <UAvatar
          :src="user?.avatarUrl || undefined"
          :alt="displayName"
          size="xl"
          :ui="{
            fallback:
              'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300',
          }"
        />
        <div class="flex-1 min-w-0">
          <!-- Name display & Sync Button -->
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ displayName }}
            </h3>
            
            <UTooltip :text="t('settings.syncName', 'Sync name from Telegram')">
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-arrow-path"
                :loading="isSyncing"
                @click="syncName"
              />
            </UTooltip>
          </div>

          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ user?.email || (user?.telegramId ? `Telegram ID: ${user.telegramId}` : '') }}
          </p>
        </div>
      </div>

      <!-- Profile details -->
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ t('user.username') }}
          </dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ user?.telegramUsername ? `@${user.telegramUsername}` : '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ t('auth.email') }}
          </dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ user?.email || '—' }}
          </dd>
        </div>
        <div v-if="user?.telegramId">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ t('user.telegramId') }}
          </dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ user.telegramId }}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ t('auth.authMode') }}
          </dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white capitalize">
            {{ t(`auth.${authMode}Mode`) }}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ t('user.role') }}
          </dt>
          <dd class="mt-1">
            <UBadge
              :color="user?.isAdmin ? 'primary' : 'neutral'"
              :variant="user?.isAdmin ? 'solid' : 'outline'"
              size="sm"
            >
              {{ user?.isAdmin ? t('user.isAdmin') : t('admin.regularUser') }}
            </UBadge>
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ t('user.createdAt') }}
          </dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ formatDate(user?.createdAt) }}
          </dd>
        </div>
      </dl>
    </UCard>

    <!-- Language section -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ t('settings.language') }}
        </h2>
      </template>
      
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {{ t('settings.selectLanguage', 'Select your preferred language for the interface') }}
      </p>
      <div class="flex flex-wrap gap-3">
        <UButton
          v-for="lang in languageOptions"
          :key="lang.value"
          :color="locale === lang.value ? 'primary' : 'neutral'"
          :variant="locale === lang.value ? 'solid' : 'outline'"
          size="lg"
          @click="changeLanguage(lang.value)"
        >
          {{ lang.label }}
        </UButton>
      </div>
    </UCard>

    <!-- Theme section -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ t('settings.theme') }}
        </h2>
      </template>

      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {{ t('settings.themeDescription', 'Choose your preferred theme interface aesthetics.') }}
      </p>
      
      <ClientOnly>
        <div class="flex flex-wrap gap-3">
          <UButton
            v-for="theme in ['system', 'light', 'dark']"
            :key="theme"
            :color="colorMode.preference === theme ? 'primary' : 'neutral'"
            :variant="colorMode.preference === theme ? 'solid' : 'outline'"
            size="lg"
            :icon="
              theme === 'system' 
                ? 'i-heroicons-computer-desktop' 
                : theme === 'light' 
                  ? 'i-heroicons-sun' 
                  : 'i-heroicons-moon'
            "
            @click="colorMode.preference = theme"
          >
            <span class="capitalize">{{ t(`settings.${theme}Theme`, theme) }}</span>
          </UButton>
        </div>
        
        <template #fallback>
          <div class="flex flex-wrap gap-3">
            <USkeleton class="h-10 w-24" />
            <USkeleton class="h-10 w-24" />
            <USkeleton class="h-10 w-24" />
          </div>
        </template>
      </ClientOnly>

      <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">
        {{
          t(
            'settings.themeNote',
            'System theme will automatically adapt to your device settings.'
          )
        }}
      </p>
    </UCard>
  </div>
</template>
