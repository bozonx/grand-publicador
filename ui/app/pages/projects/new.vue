<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const router = useRouter()
const { createProject, isLoading } = useProjects()

/**
 * Handle project creation
 */
async function handleCreate(data: { name: string; description: string }) {
  const project = await createProject({
    name: data.name,
    description: data.description || undefined,
  })

  if (project) {
    // Navigate to the created project
    router.push(`/projects/${project.id}`)
  }
}

/**
 * Cancel and go back to projects list
 */
function handleCancel() {
  router.push('/projects')
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Back button -->
    <div class="mb-6">
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-heroicons-arrow-left"
        class="-ml-2.5"
        @click="handleCancel"
      >
        {{ t('common.back') }}
      </UButton>
    </div>

    <!-- Create form -->
    <FormsProjectForm :is-loading="isLoading" @submit="handleCreate" @cancel="handleCancel" />
  </div>
</template>
