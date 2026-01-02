<script setup lang="ts">
import { useProjects } from '~/composables/useProjects'
import type { ProjectWithRole } from '~/stores/projects'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { fetchProject, currentProject } = useProjects()
const { canGoBack, goBack } = useNavigation()

const projectId = computed(() => route.params.id as string)

onMounted(() => {
  if (projectId.value && (!currentProject.value || currentProject.value.id !== projectId.value)) {
    fetchProject(projectId.value)
  }
})

/**
 * Handle successful post creation
 */
function handleSuccess(postId: string) {
  router.push(`/projects/${projectId.value}/posts/${postId}`)
}

/**
 * Handle cancel
 */
function handleCancel() {
  goBack()
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
        :disabled="!canGoBack"
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

    <!-- Post form -->
    <FormsPostForm
      :project-id="projectId"
      :channel-id="(route.query.channelId as string)"
      @success="handleSuccess"
      @cancel="handleCancel"
    />
  </div>
</template>
