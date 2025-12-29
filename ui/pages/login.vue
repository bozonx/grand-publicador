<template>
  <div class="flex flex-col items-center justify-center h-screen px-4">
    <div class="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl">
      <h2 class="text-3xl font-bold mb-6 text-center text-blue-400">Login</h2>
      
      <div class="space-y-6">
        <p class="text-gray-400 text-center">
          Login via Telegram to access your blogs and channels.
        </p>
        
        <div class="flex flex-col gap-4">
          <input 
            v-model="initData" 
            type="text" 
            placeholder="Paste Telegram initData here (for testing)"
            class="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button 
            @click="handleLogin" 
            :disabled="loading"
            class="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-xl font-bold transition-all"
          >
            {{ loading ? 'Authenticating...' : 'Login (Test)' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const auth = useAuthStore();
const initData = ref('');
const loading = ref(false);

async function handleLogin() {
  if (!initData.value) return;
  
  loading.value = true;
  try {
    await auth.loginWithTelegram(initData.value);
    navigateTo('/');
  } catch (error) {
    alert('Authentication failed: ' + (error.data?.message || error.message));
  } finally {
    loading.value = false;
  }
}
</script>
