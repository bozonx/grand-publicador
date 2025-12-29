<template>
  <div>
    <NuxtRouteAnnouncer />
    <UApp>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </div>
</template>

<script setup lang="ts">
const { authMode, loginWithDev, isAuthenticated } = useAuth();

onMounted(async () => {
  if (authMode.value === 'dev' && !isAuthenticated.value) {
    console.log('Auto-logging in for Dev Mode...');
    try {
      await loginWithDev();
      console.log('Dev Login Successful');
    } catch (e) {
      console.error('Dev Login Failed', e);
    }
  }
});
</script>
