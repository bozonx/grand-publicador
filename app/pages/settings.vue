<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const { user, displayName, authMode } = useAuth()
</script>

<template>
  <div>
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
          <div class="flex items-center gap-4 mb-6">
            <UAvatar
              :alt="displayName"
              size="xl"
              :ui="{ fallback: 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' }"
            />
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ displayName }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ user?.email || `Telegram ID: ${user?.telegram_id}` }}
              </p>
            </div>
          </div>

          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('user.username') }}
              </dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ user?.username || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('auth.authMode') }}
              </dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ t(`auth.${authMode}Mode`) }}
              </dd>
            </div>
            <div v-if="user?.telegram_id">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('user.telegramId') }}
              </dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ user.telegram_id }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('user.createdAt') }}
              </dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—' }}
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
          <UiLanguageSwitcher />
        </div>
      </div>
    </div>
  </div>
</template>
