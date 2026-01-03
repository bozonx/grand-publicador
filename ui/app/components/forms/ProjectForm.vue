<script setup lang="ts">
import type { ProjectWithRole } from '~/stores/projects'

interface Props {
  /** Project data for editing, null for creating new */
  project?: ProjectWithRole | null
  /** Whether the form is in loading state */
  isLoading?: boolean
  /** Custom label for submit button */
  submitLabel?: string
  /** Custom label for cancel button */
  cancelLabel?: string
  /** Whether to hide the header section */
  hideHeader?: boolean
  /** Whether to hide the cancel button */
  hideCancel?: boolean
  /** Whether to remove the card styling wrapper */
  flat?: boolean
}

interface Emits {
  (e: 'submit', data: { name: string; description: string }): void | Promise<void>
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  project: null,
  isLoading: false,
  submitLabel: undefined,
  cancelLabel: undefined,
  hideHeader: false,
  hideCancel: false,
  flat: false,
})

const emit = defineEmits<Emits>()

const saveButtonRef = ref<{ showSuccess: () => void; showError: () => void } | null>(null)

const { t } = useI18n()

const isEditMode = computed(() => !!props.project?.id)

// Helper function to format date
function formatDate(date: string | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleString()
}

// Form state
const state = reactive({
  name: props.project?.name || '',
  description: props.project?.description || '',
})

/**
 * Handle form submission
 */
async function handleSubmit() {
  if (!state.name || state.name.length < 2) return

  try {
    await emit('submit', {
      name: state.name,
      description: state.description,
    })
    saveButtonRef.value?.showSuccess()
  } catch (error) {
    saveButtonRef.value?.showError()
    const toast = useToast()
    toast.add({
      title: t('common.error'),
      description: t('common.saveError', 'Failed to save'),
      color: 'error',
    })
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div :class="[flat ? '' : 'bg-white dark:bg-gray-800 rounded-lg shadow p-6']">
    <div v-if="!hideHeader" class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ isEditMode ? t('project.editProject') : t('project.createProject') }}
      </h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{
          isEditMode
            ? t('project.editDescription', 'Update your project information below')
            : t('project.createDescription', 'Fill in the details to create a new project')
        }}
      </p>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Created date (read-only, edit mode only) -->
      <div v-if="isEditMode && project?.createdAt" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t('project.createdAt', 'Created At') }}
        </label>
        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <span class="text-gray-900 dark:text-white">{{ formatDate(project.createdAt) }}</span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('project.createdAtHelp', 'The date when this project was created') }}
        </p>
      </div>

      <!-- Project name -->
      <UFormField
        :label="t('project.name')"
        required
        :error="state.name && state.name.length < 2 ? t('validation.minLength', { min: 2 }) : undefined"
      >
        <UInput
          v-model="state.name"
          :placeholder="t('project.namePlaceholder', 'Enter project name')"
          class="w-full"
          size="lg"
        />
      </UFormField>

      <!-- Project description -->
      <UFormField
        :label="t('project.description')"
        :help="`${t('common.optional')} — ${t('validation.maxLength', { max: 500 })}`"
        :error="state.description && state.description.length > 500 ? t('validation.maxLength', { max: 500 }) : undefined"
      >
        <UTextarea
          v-model="state.description"
          :placeholder="t('project.descriptionPlaceholder', 'Enter project description')"
          class="w-full"
          :rows="3"
        />
      </UFormField>

      <!-- Form actions -->
      <div
        class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <UButton
          v-if="!hideCancel"
          type="button"
          color="neutral"
          variant="ghost"
          :disabled="isLoading"
          @click="handleCancel"
        >
          {{ cancelLabel || t('common.cancel') }}
        </UButton>
        <UiSaveButton
          ref="saveButtonRef"
          :loading="isLoading"
          :disabled="!state.name || state.name.length < 2 || state.description.length > 500"
          :label="submitLabel || (isEditMode ? t('common.save') : t('common.create'))"
        />
      </div>
    </form>
  </div>
</template>
