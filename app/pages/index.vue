<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const { displayName } = useAuth()
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('dashboard.title') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ t('dashboard.welcome') }}, {{ displayName }}!
      </p>
    </div>

    <!-- Quick actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Blogs card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
            <UIcon name="i-heroicons-book-open" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ t('navigation.blogs') }}
          </h3>
        </div>
        <p class="text-gray-500 dark:text-gray-400 mb-4 text-sm">
          {{ t('blog.noBlogsFound') }}
        </p>
        <NuxtLink to="/blogs">
          <UButton icon="i-heroicons-plus" class="w-full">
            {{ t('blog.createBlog') }}
          </UButton>
        </NuxtLink>
      </div>

      <!-- Channels card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <UIcon name="i-heroicons-signal" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ t('navigation.channels') }}
          </h3>
        </div>
        <p class="text-gray-500 dark:text-gray-400 mb-4 text-sm">
          {{ t('channel.noChannelsFound') }}
        </p>
        <UButton icon="i-heroicons-plus" disabled class="w-full">
          {{ t('channel.createChannel') }}
        </UButton>
      </div>

      <!-- Posts card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <UIcon name="i-heroicons-document-text" class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ t('navigation.posts') }}
          </h3>
        </div>
        <p class="text-gray-500 dark:text-gray-400 mb-4 text-sm">
          {{ t('post.noPostsFound') }}
        </p>
        <UButton icon="i-heroicons-plus" disabled class="w-full">
          {{ t('post.createPost') }}
        </UButton>
      </div>
    </div>

    <!-- Recent activity section (placeholder for future) -->
    <div class="mt-8">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {{ t('dashboard.recentPosts') }}
      </h2>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p class="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
          {{ t('post.noPostsFound') }}
        </p>
      </div>
    </div>
  </div>
</template>
