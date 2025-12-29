<script setup lang="ts">
const { t } = useI18n()
const { isAdmin } = useAuth()
const route = useRoute()

interface NavItem {
  label: string
  to: string
  icon: string
  adminOnly?: boolean
}

const navItems = computed<NavItem[]>(() => [
  {
    label: t('navigation.dashboard'),
    to: '/',
    icon: 'i-heroicons-home',
  },
  {
    label: t('navigation.blogs'),
    to: '/blogs',
    icon: 'i-heroicons-book-open',
  },
  {
    label: t('navigation.users'),
    to: '/admin/users',
    icon: 'i-heroicons-users',
    adminOnly: true,
  },
  {
    label: t('navigation.settings'),
    to: '/settings',
    icon: 'i-heroicons-cog-6-tooth',
  },
])

const visibleNavItems = computed(() =>
  navItems.value.filter((item) => !item.adminOnly || isAdmin.value)
)

function isActive(to: string): boolean {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(to)
}
</script>

<template>
  <nav class="flex flex-col gap-1">
    <NuxtLink
      v-for="item in visibleNavItems"
      :key="item.to"
      :to="item.to"
      class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      :class="[
        isActive(item.to)
          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
      ]"
    >
      <UIcon :name="item.icon" class="w-5 h-5" />
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
