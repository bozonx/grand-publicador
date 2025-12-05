<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('navigation.users') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ t('auth.adminOnly') }}
      </p>
    </div>

    <!-- Empty state / placeholder -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
      <UIcon name="i-heroicons-users" class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        User Management
      </h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
        User management functionality will be implemented in a future step.
      </p>
    </div>
  </div>
</template>
