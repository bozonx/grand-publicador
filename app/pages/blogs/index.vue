<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('blog.titlePlural') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('blog.myBlogs') }}
        </p>
      </div>
      <UButton icon="i-heroicons-plus">
        {{ t('blog.createBlog') }}
      </UButton>
    </div>

    <!-- Empty state -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
      <UIcon name="i-heroicons-book-open" class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('blog.noBlogsFound') }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        Create your first blog to start managing your social media content.
      </p>
      <UButton icon="i-heroicons-plus">
        {{ t('blog.createBlog') }}
      </UButton>
    </div>
  </div>
</template>
