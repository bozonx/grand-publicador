<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t, locale, setLocale, availableLocales } = useI18n()
const { user, displayName, authMode, refreshUser } = useAuth()
const toast = useToast()

// Edit mode state
const isEditingName = ref(false)
const newFullName = ref('')
const isSaving = ref(false)

// Language options
const languageOptions = computed(() =>
  availableLocales.map((loc: string) => ({
    value: loc,
    label: loc === 'ru' ? 'Русский' : 'English',
  }))
)

/**
 * Start editing name
 */
function startEditingName() {
  newFullName.value = user.value?.fullName || ''
  isEditingName.value = true
}

/**
 * Cancel editing name
 */
function cancelEditingName() {
  isEditingName.value = false
  newFullName.value = ''
}

/**
 * Save new name
 */
async function saveFullName() {
  if (!user.value?.id || !newFullName.value.trim()) {
    return
  }

  isSaving.value = true

  try {
    // TODO: Implement update user profile in backend
    // const { error } = await api.put('/users/me', { full_name: newFullName.value.trim() })
    
    // Simulating success for now or warning
    await new Promise(resolve => setTimeout(resolve, 500))
    
    toast.add({
      title: t('common.warning'),
      description: 'Update profile not implemented in backend yet',
      color: 'warning',
    })

    // Refresh user data (would work if we actually updated)
    // await refreshUser()

    // eslint-disable-next-line no-console
    console.warn('Profile update not implemented')

    isEditingName.value = false
    newFullName.value = ''
  } catch (err) {
    console.error('Failed to save name:', err)
    toast.add({
      title: t('common.error'),
      description: t('settings.nameSaveError', 'Failed to save name'),
      color: 'error',
    })
  } finally {
    isSaving.value = false
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
  <div class="max-w-4xl mx-auto">
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('settings.title') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ t('settings.account') }}
      </p>
    </div>

    <!-- Settings sections -->
    <div class="space-y-6">
      <!-- Profile section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ t('auth.profile') }}
          </h2>
        </div>
        <div class="p-6">
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
              <!-- Name display/edit -->
              <div v-if="!isEditingName" class="flex items-center gap-2">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ displayName }}
                </h3>
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  icon="i-heroicons-pencil"
                  @click="startEditingName"
                />
              </div>

              <!-- Name edit form -->
              <div v-else class="flex items-center gap-2">
                <UInput
                  v-model="newFullName"
                  :placeholder="t('user.displayName')"
                  size="sm"
                  class="flex-1 max-w-xs"
                  @keyup.enter="saveFullName"
                  @keyup.escape="cancelEditingName"
                />
                <UButton
                  color="primary"
                  size="xs"
                  icon="i-heroicons-check"
                  :loading="isSaving"
                  @click="saveFullName"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-x-mark"
                  :disabled="isSaving"
                  @click="cancelEditingName"
                />
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
                {{ user?.username ? `@${user.username}` : '—' }}
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
        </div>
      </div>

      <!-- Language section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ t('settings.language') }}
          </h2>
        </div>
        <div class="p-6">
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
        </div>
      </div>

      <!-- Theme section (placeholder) -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ t('settings.theme') }}
          </h2>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {{ t('settings.themeDescription', 'Choose your preferred theme') }}
          </p>
          <div class="flex flex-wrap gap-3">
            <UButton color="neutral" variant="outline" icon="i-heroicons-sun" size="lg">
              {{ t('settings.lightTheme', 'Light') }}
            </UButton>
            <UButton color="neutral" variant="outline" icon="i-heroicons-moon" size="lg">
              {{ t('settings.darkTheme', 'Dark') }}
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-heroicons-computer-desktop"
              size="lg"
            >
              {{ t('settings.systemTheme', 'System') }}
            </UButton>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">
            {{
              t(
                'settings.themeNote',
                'Theme preference is synced with your system settings by default.'
              )
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
