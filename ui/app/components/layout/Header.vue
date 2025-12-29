<script setup lang="ts">
const { t } = useI18n()
const { displayName, authMode, signOut, isAdmin, user } = useAuth()

const emit = defineEmits<{
  toggleSidebar: []
}>()

interface UserMenuItem {
  label: string
  icon: string
  to?: string
  click?: () => void | Promise<void>
}

const userMenuItems = computed<UserMenuItem[]>(() => {
  const items: UserMenuItem[] = [
    {
      label: t('navigation.settings'),
      icon: 'i-heroicons-cog-6-tooth',
      to: '/settings',
    },
  ]

  // Add logout only for browser mode (Telegram users can't logout)
  if (authMode.value === 'browser') {
    items.push({
      label: t('auth.logout'),
      icon: 'i-heroicons-arrow-right-on-rectangle',
      click: signOut,
    })
  }

  return items
})
</script>

<template>
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between h-16 px-4 sm:px-6">
      <!-- Left side: Mobile menu button + Logo -->
      <div class="flex items-center gap-4">
        <!-- Mobile menu button -->
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-heroicons-bars-3"
          class="lg:hidden"
          @click="emit('toggleSidebar')"
        />

        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-xl font-bold text-gray-900 dark:text-white"> Grand Publicador </span>
        </NuxtLink>
      </div>

      <!-- Right side: Language switcher + User menu -->
      <div class="flex items-center gap-3">
        <UiLanguageSwitcher />

        <!-- User menu -->
        <UDropdownMenu :items="userMenuItems">
          <UButton variant="ghost" color="neutral" class="flex items-center gap-2">
            <UAvatar
              :alt="displayName"
              size="sm"
              :ui="{
                fallback:
                  'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300',
              }"
            />
            <span class="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ displayName }}
            </span>
            <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 text-gray-500" />
          </UButton>
        </UDropdownMenu>
      </div>
    </div>

    <!-- Auth mode badge (dev only) -->
    <div
      v-if="authMode === 'dev'"
      class="bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800 px-4 py-1"
    >
      <div class="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-400">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
        <span>{{ t('auth.devMode') }} — Telegram ID: {{ user?.telegramId }}</span>
        <span
          v-if="isAdmin"
          class="ml-2 px-1.5 py-0.5 rounded bg-yellow-200 dark:bg-yellow-800 font-medium"
        >
          {{ t('user.isAdmin') }}
        </span>
      </div>
    </div>
  </header>
</template>
