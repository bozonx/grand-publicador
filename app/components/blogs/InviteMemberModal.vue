<script setup lang="ts">
import type { Database } from '~/types/database.types'

type BlogRole = Database['public']['Enums']['blog_role']

const props = defineProps<{
  modelValue: boolean
  blogId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const { t } = useI18n()
const { addMember } = useBlogs()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isLoading = ref(false)
const emailOrUsername = ref('')
const selectedRole = ref<BlogRole>('viewer')

const roleOptions = computed(() => [
  { label: t('roles.admin'), value: 'admin' },
  { label: t('roles.editor'), value: 'editor' },
  { label: t('roles.viewer'), value: 'viewer' }
])

async function handleInvite() {
  if (!emailOrUsername.value) return

  isLoading.value = true
  const success = await addMember(props.blogId, emailOrUsername.value, selectedRole.value)
  isLoading.value = false

  if (success) {
    emit('success')
    closeModal()
  }
}

function closeModal() {
  isOpen.value = false
  emailOrUsername.value = ''
  selectedRole.value = 'viewer'
}
</script>

<template>
  <UModal v-model="isOpen">
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('blogMember.invite') }}
        </h3>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-x-mark-20-solid"
          class="-my-1"
          @click="closeModal"
        />
      </div>

      <form @submit.prevent="handleInvite" class="space-y-4">
        <UFormGroup :label="t('blogMember.userEmailOrUsername')" required>
          <UInput
            v-model="emailOrUsername"
            :placeholder="t('blogMember.searchPlaceholder')"
            autofocus
          />
        </UFormGroup>

        <UFormGroup :label="t('common.role')">
          <USelect
            v-model="selectedRole"
            :options="roleOptions"
            option-attribute="label"
          />
        </UFormGroup>

        <div class="flex justify-end gap-3 mt-6">
          <UButton
            color="neutral"
            variant="ghost"
            @click="closeModal"
          >
            {{ t('common.cancel') }}
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isLoading"
            :disabled="!emailOrUsername"
          >
            {{ t('blogMember.invite') }}
          </UButton>
        </div>
      </form>
    </div>
  </UModal>
</template>
