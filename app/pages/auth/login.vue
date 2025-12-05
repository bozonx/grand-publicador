<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const { t } = useI18n()
const { signInWithEmail, signInWithOAuth, isLoading, error } = useAuth()
const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

const showPassword = ref(false)

async function handleSubmit() {
  const user = await signInWithEmail(form.email, form.password)
  if (user) {
    router.push('/')
  }
}

async function handleOAuth(provider: 'google' | 'github') {
  await signInWithOAuth(provider)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Grand Publicador
        </h1>
        <h2 class="mt-4 text-xl text-gray-600 dark:text-gray-300">
          {{ t('auth.signIn') }}
        </h2>
      </div>

      <!-- Error message -->
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        :title="t('common.error')"
        :description="error"
      />

      <!-- Login form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <UFormField :label="t('auth.email')">
            <UInput
              v-model="form.email"
              type="email"
              :placeholder="t('auth.email')"
              required
              autocomplete="email"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('auth.password')">
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('auth.password')"
              required
              autocomplete="current-password"
              size="lg"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  variant="ghost"
                  size="xs"
                  :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormField>
        </div>

        <div class="flex items-center justify-between">
          <NuxtLink
            to="/auth/forgot-password"
            class="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            {{ t('auth.forgotPassword') }}
          </NuxtLink>
        </div>

        <UButton
          type="submit"
          size="lg"
          block
          :loading="isLoading"
        >
          {{ t('auth.signIn') }}
        </UButton>
      </form>

      <!-- Divider -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">
            {{ t('auth.orContinueWith') }}
          </span>
        </div>
      </div>

      <!-- OAuth buttons -->
      <div class="grid grid-cols-2 gap-3">
        <UButton
          variant="outline"
          size="lg"
          icon="i-simple-icons-google"
          :loading="isLoading"
          @click="handleOAuth('google')"
        >
          Google
        </UButton>
        <UButton
          variant="outline"
          size="lg"
          icon="i-simple-icons-github"
          :loading="isLoading"
          @click="handleOAuth('github')"
        >
          GitHub
        </UButton>
      </div>

      <!-- Sign up link -->
      <p class="text-center text-sm text-gray-600 dark:text-gray-400">
        {{ t('auth.noAccount') }}
        <NuxtLink
          to="/auth/register"
          class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
        >
          {{ t('auth.signUp') }}
        </NuxtLink>
      </p>

      <!-- Telegram hint -->
      <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p class="text-sm text-blue-700 dark:text-blue-300 text-center">
          💡 {{ t('auth.openInTelegram') }}
        </p>
      </div>
    </div>
  </div>
</template>
