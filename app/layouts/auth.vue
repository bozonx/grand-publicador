<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const availableLocales = computed(() => 
  locales.value.map(l => typeof l === 'string' ? { code: l, name: l } : l)
)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Language switcher in corner -->
    <div class="absolute top-4 right-4">
      <UDropdownMenu
        :items="availableLocales.map(l => ({
          label: l.name,
          click: () => setLocale(l.code),
          active: locale === l.code,
        }))"
      >
        <UButton variant="ghost" size="sm" icon="i-heroicons-language">
          {{ availableLocales.find(l => l.code === locale)?.name }}
        </UButton>
      </UDropdownMenu>
    </div>

    <slot />
  </div>
</template>
