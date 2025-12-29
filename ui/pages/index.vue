<template>
  <div class="flex flex-col items-center justify-center h-screen">
    <h1 class="text-4xl font-bold mb-8">Grand Publicador</h1>
    <p class="text-xl mb-12 text-gray-400">Migration to NestJS + Nuxt 4 complete.</p>
    
    <div v-if="auth.isLoggedIn" class="text-center">
      <p class="mb-4">Welcome back, {{ auth.user.fullName || auth.user.username }}!</p>
      <button 
        @click="auth.logout()" 
        class="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
      >
        Logout
      </button>
    </div>
    <div v-else class="text-center">
      <NuxtLink 
        to="/login"
        class="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-500/20"
      >
        Go to Login
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const auth = useAuthStore();
</script>
