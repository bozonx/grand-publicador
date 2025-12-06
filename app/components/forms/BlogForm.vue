<script setup lang="ts">
import type { BlogWithRole } from '~/stores/blogs'

interface Props {
  /** Blog data for editing, null for creating new */
  blog?: BlogWithRole | null
  /** Whether the form is in loading state */
  isLoading?: boolean
}

interface Emits {
  (e: 'submit', data: { name: string; description: string }): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  blog: null,
  isLoading: false,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const form = ref<{ node: any } | null>(null)

const isEditMode = computed(() => !!props.blog?.id)

/**
 * Form submission handler
 * Validates and emits the form data
 */
function handleSubmit(data: Record<string, unknown>) {
  console.log('[BlogForm] handleSubmit called with:', data)
  emit('submit', {
    name: data.name as string,
    description: (data.description as string) || '',
  })
}

function handleCancel() {
  emit('cancel')
}

/**
 * Programmatically submit the form
 */
function submitForm() {
  form.value?.node.submit()
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ isEditMode ? t('blog.editBlog') : t('blog.createBlog') }}
      </h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{
          isEditMode
            ? 'Update your blog information below'
            : 'Fill in the details to create a new blog'
        }}
      </p>
    </div>

    <FormKit ref="form" type="form" :actions="false" @submit="handleSubmit">
      <div class="space-y-6">
        <!-- Blog name -->
        <FormKit
          type="text"
          name="name"
          :label="t('blog.name')"
          :placeholder="t('blog.name')"
          :value="blog?.name || ''"
          validation="required|length:2,100"
          :validation-messages="{
            required: t('validation.required'),
            length:
              t('validation.minLength', { min: 2 }) +
              ' / ' +
              t('validation.maxLength', { max: 100 }),
          }"
        />

        <!-- Blog description -->
        <FormKit
          type="textarea"
          name="description"
          :label="t('blog.description')"
          :placeholder="t('blog.description')"
          :value="blog?.description || ''"
          validation="length:0,500"
          :validation-messages="{
            length: t('validation.maxLength', { max: 500 }),
          }"
          :help="`${t('common.optional')} — ${t('validation.maxLength', { max: 500 })}`"
        />

        <!-- Form actions -->
        <div
          class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            :disabled="isLoading"
            @click="handleCancel"
          >
            {{ t('common.cancel') }}
          </UButton>
          <UButton type="button" color="primary" :loading="isLoading" @click="submitForm">
            {{ isEditMode ? t('common.save') : t('common.create') }}
          </UButton>
        </div>
      </div>
    </FormKit>
  </div>
</template>
