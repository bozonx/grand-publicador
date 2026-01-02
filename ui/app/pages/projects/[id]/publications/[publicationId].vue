<script setup lang="ts">
import { useProjects } from '~/composables/useProjects'
import { usePublications } from '~/composables/usePublications'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { fetchProject, currentProject } = useProjects()
const { fetchPublication, currentPublication, isLoading: isPublicationLoading } = usePublications()
const { canGoBack, goBack } = useNavigation()

const projectId = computed(() => route.params.id as string)
const publicationId = computed(() => route.params.publicationId as string)

onMounted(async () => {
    // Fetch project if needed
    if (projectId.value && (!currentProject.value || currentProject.value.id !== projectId.value)) {
        fetchProject(projectId.value)
    }
    
    // Fetch publication
    if (publicationId.value) {
        await fetchPublication(publicationId.value)
    }
})

/**
 * Handle successful publication update
 */
function handleSuccess(id: string) {
  // Go back to where user came from
  goBack()
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

    <!-- Loading state -->
    <div v-if="isPublicationLoading" class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <!-- Publication form -->
    <FormsPublicationForm
      v-else-if="currentPublication"
      :project-id="projectId"
      :publication="currentPublication"
      @success="handleSuccess"
      @cancel="handleCancel"
    />

    <!-- Linked Posts Section -->
    <div v-if="currentPublication && currentPublication.posts && currentPublication.posts.length > 0" class="mt-8 pb-12">
      <div class="flex items-center gap-2 mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('publication.linkedPosts', 'Linked Posts') }}
        </h3>
        <UBadge variant="subtle" color="neutral" size="sm" class="rounded-full">
          {{ currentPublication.posts.length }}
        </UBadge>
      </div>
      
      <div class="space-y-4">
        <PostsPostEditBlock
          v-for="post in currentPublication.posts"
          :key="post.id"
          :post="post"
        />
      </div>
    </div>
    
    <!-- Error/Not Found -->
    <div v-else class="text-center py-12">
        <p class="text-gray-500">{{ t('errors.notFound') }}</p>
    </div>
  </div>
</template>
