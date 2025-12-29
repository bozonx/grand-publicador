<script setup lang="ts">
// Auth layout for login/register pages
// Minimal layout without navigation sidebar
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header with logo and language switcher -->
    <header class="absolute top-0 left-0 right-0 z-10">
      <div class="flex items-center justify-between px-4 py-4 sm:px-6">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-xl font-bold text-gray-900 dark:text-white"> Grand Publicador </span>
        </NuxtLink>

        <!-- Language switcher -->
        <UiLanguageSwitcher />
      </div>
    </header>

    <!-- Main content -->
    <slot />
  </div>
</template>
