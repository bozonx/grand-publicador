<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const { t } = useI18n()
const { signUpWithEmail, isLoading, error } = useAuth()

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
})

const showPassword = ref(false)
const localError = ref<string | null>(null)
const success = ref(false)

async function handleSubmit() {
  localError.value = null

  if (form.password !== form.confirmPassword) {
    localError.value = t('auth.passwordMismatch')
    return
  }

  if (form.password.length < 6) {
    localError.value = t('auth.weakPassword')
    return
  }

  const user = await signUpWithEmail(form.email, form.password, form.fullName || undefined)
  if (user) {
    success.value = true
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Grand Publicador
        </h1>
        <h2 class="mt-4 text-xl text-gray-600 dark:text-gray-300">
          {{ t('auth.signUp') }}
        </h2>
      </div>

      <UAlert
        v-if="success"
        color="success"
        variant="soft"
        :title="t('common.success')"
        :description="t('auth.signUpSuccess')"
      />

      <UAlert
        v-if="error || localError"
        color="error"
        variant="soft"
        :title="t('common.error')"
        :description="error || localError || undefined"
      />

      <form v-if="!success" class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <UFormField :label="t('auth.fullName')">
            <UInput
              v-model="form.fullName"
              type="text"
              :placeholder="t('auth.fullName')"
              autocomplete="name"
              size="lg"
              class="w-full"
            />
          </UFormField>

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
              autocomplete="new-password"
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

          <UFormField :label="t('auth.confirmPassword')">
            <UInput
              v-model="form.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('auth.confirmPassword')"
              required
              autocomplete="new-password"
              size="lg"
              class="w-full"
            />
          </UFormField>
        </div>

        <UButton type="submit" size="lg" block :loading="isLoading">
          {{ t('auth.signUp') }}
        </UButton>
      </form>

      <p class="text-center text-sm text-gray-600 dark:text-gray-400">
        {{ t('auth.hasAccount') }}
        <NuxtLink
          to="/auth/login"
          class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
        >
          {{ t('auth.signIn') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
