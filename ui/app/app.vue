<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :page-key="route => route.fullPath" />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
// Auth logic moved to plugins/auth.client.ts
</script>
