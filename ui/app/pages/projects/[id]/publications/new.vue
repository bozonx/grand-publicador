<script setup lang="ts">
import { useProjects } from '~/composables/useProjects'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { fetchProject, currentProject } = useProjects()

const projectId = computed(() => route.params.id as string)

onMounted(() => {
  if (projectId.value && (!currentProject.value || currentProject.value.id !== projectId.value)) {
    fetchProject(projectId.value)
  }
})

/**
 * Handle successful publication creation
 */
function handleSuccess(publicationId: string) {
  // Redirect to the project dashboard or publication details?
  // Current dashboard lists draft publications.
  router.push(`/projects/${projectId.value}`)
}

/**
 * Handle cancel
 */
function handleCancel() {
  router.push(`/projects/${projectId.value}`)
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
        <span class="flex items-center gap-1">
          {{ t('common.back') }}
          <span v-if="currentProject" class="text-gray-500 font-normal">
            to {{ currentProject.name }}
          </span>
        </span>
      </UButton>
    </div>

    <!-- Publication form -->
    <FormsPublicationForm
      :project-id="projectId"
      @success="handleSuccess"
      @cancel="handleCancel"
    />
  </div>
</template>
