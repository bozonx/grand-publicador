<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const { user, displayName, authMode, signOut, isAdmin } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Grand Publicador
          </h1>
          <div class="flex items-center gap-4">
            <UiLanguageSwitcher />
            <UButton
              v-if="authMode !== 'telegram'"
              variant="ghost"
              color="error"
              @click="signOut"
            >
              {{ t('auth.logout') }}
            </UButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {{ t('dashboard.welcome') }}, {{ displayName }}!
        </h2>
        <div class="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span class="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
            {{ t('auth.authMode') }}: {{ t(`auth.${authMode}Mode`) }}
          </span>
          <span
            v-if="isAdmin"
            class="inline-flex items-center px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
          >
            {{ t('user.isAdmin') }}
          </span>
          <span
            v-if="user?.telegram_id"
            class="inline-flex items-center px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
          >
            Telegram ID: {{ user.telegram_id }}
          </span>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ t('navigation.blogs') }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            {{ t('blog.noBlogsFound') }}
          </p>
          <UButton icon="i-heroicons-plus">
            {{ t('blog.createBlog') }}
          </UButton>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ t('navigation.channels') }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            {{ t('channel.noChannelsFound') }}
          </p>
          <UButton icon="i-heroicons-plus" disabled>
            {{ t('channel.createChannel') }}
          </UButton>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ t('navigation.posts') }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            {{ t('post.noPostsFound') }}
          </p>
          <UButton icon="i-heroicons-plus" disabled>
            {{ t('post.createPost') }}
          </UButton>
        </div>
      </div>
    </main>
  </div>
</template>
