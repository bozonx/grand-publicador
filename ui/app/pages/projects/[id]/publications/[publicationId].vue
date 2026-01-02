<script setup lang="ts">
import { useProjects } from '~/composables/useProjects'
import { usePublications } from '~/composables/usePublications'
import { useChannels } from '~/composables/useChannels'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { fetchProject, currentProject } = useProjects()
const { 
  fetchPublication, 
  currentPublication, 
  isLoading: isPublicationLoading, 
  deletePublication, 
  toggleArchive 
} = usePublications()
const { fetchChannels, channels } = useChannels()
const { canGoBack, goBack } = useNavigation()

const projectId = computed(() => route.params.id as string)
const publicationId = computed(() => route.params.publicationId as string)

const isCreatingPost = ref(false)
const isFormCollapsed = ref(true)
const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)

// Determine available channels (in project but not yet in publication)
const availableChannels = computed(() => {
    if (!channels.value || !currentPublication.value) return []
    const usedChannelIds = currentPublication.value.posts?.map((p: any) => p.channelId) || []
    return channels.value.filter(ch => !usedChannelIds.includes(ch.id))
})

onMounted(async () => {
    // Fetch project if needed
    if (projectId.value && (!currentProject.value || currentProject.value.id !== projectId.value)) {
        await fetchProject(projectId.value)
    }
    
    if (projectId.value) {
        await fetchChannels(projectId.value)
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
 * Handle post creation success
 */
async function handlePostCreated() {
    isCreatingPost.value = false
    // Refresh publication to show new post
    if (publicationId.value) {
        await fetchPublication(publicationId.value)
    }
}

/**
 * Handle cancel
 */
function handleCancel() {
  goBack()
}

async function handleToggleArchive() {
    if (!currentPublication.value) return
    await toggleArchive(currentPublication.value.id, !!currentPublication.value.archivedAt)
}

async function handleDelete() {
    if (!currentPublication.value) return
    isDeleting.value = true
    const success = await deletePublication(currentPublication.value.id)
    isDeleting.value = false
    if (success) {
        isDeleteModalOpen.value = false
        // Navigate to project page as the parent context
        router.push(`/projects/${projectId.value}`)
    }
}

function toggleFormCollapse() {
  isFormCollapsed.value = !isFormCollapsed.value
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
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

    <div v-else-if="currentPublication" class="space-y-6 pb-12">
        <!-- Block 1: Publication Info & Actions (Non-collapsible) -->
        <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800/50 overflow-hidden shadow-sm">
            <div class="p-6">
                <!-- Header with title and actions -->
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-500" />
                        {{ t('publication.edit') }}
                    </h2>
                    
                    <!-- Action Buttons -->
                    <div class="flex items-center gap-2">
                        <UButton
                            :label="currentPublication.archivedAt ? t('common.restore') : t('common.archive')"
                            :icon="currentPublication.archivedAt ? 'i-heroicons-arrow-uturn-left' : 'i-heroicons-archive-box'"
                            variant="soft"
                            size="sm"
                            :color="currentPublication.archivedAt ? 'warning' : 'neutral'"
                            @click="handleToggleArchive"
                        />
                        <UButton
                            :label="t('common.delete')"
                            icon="i-heroicons-trash"
                            variant="soft"
                            size="sm"
                            color="error"
                            @click="isDeleteModalOpen = true"
                        />
                    </div>
                </div>

                <!-- Metadata Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <!-- Created -->
                    <div>
                        <div class="text-gray-500 dark:text-gray-400 mb-1">{{ t('post.createdAt') }}</div>
                        <div class="text-gray-900 dark:text-white font-medium">
                            {{ formatDate(currentPublication.createdAt) }}
                        </div>
                        <div v-if="currentPublication.author" class="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                            {{ currentPublication.author.fullName || currentPublication.author.telegramUsername || t('common.unknown') }}
                        </div>
                    </div>

                    <!-- Updated -->
                    <div>
                        <div class="text-gray-500 dark:text-gray-400 mb-1">{{ t('post.updatedAt') }}</div>
                        <div class="text-gray-900 dark:text-white font-medium">
                            {{ formatDate(currentPublication.updatedAt) }}
                        </div>
                    </div>

                    <!-- Archived info (if archived) -->
                    <div v-if="currentPublication.archivedAt" class="md:col-span-2">
                        <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                            <div class="flex items-center gap-2 mb-1">
                                <UIcon name="i-heroicons-archive-box" class="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                <span class="text-yellow-800 dark:text-yellow-200 font-medium text-sm">{{ t('common.archived') }}</span>
                            </div>
                            <div class="text-yellow-700 dark:text-yellow-300 text-xs">
                                {{ formatDate(currentPublication.archivedAt) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Block 2: Collapsible Publication Form (styled like PostEditBlock) -->
        <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800/50 overflow-hidden shadow-sm">
            <!-- Header -->
            <div 
                class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors select-none"
                @click="toggleFormCollapse"
            >
                <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-pencil-square" class="w-5 h-5 text-gray-500" />
                    <span class="font-medium text-gray-900 dark:text-white">
                        {{ t('publication.editDescription') }}
                    </span>
                </div>

                <!-- Expand/Collapse Button -->
                <UButton
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :icon="isFormCollapsed ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-up'"
                    class="ml-2"
                />
            </div>

            <!-- Collapsible Content -->
            <div 
                v-show="!isFormCollapsed" 
                class="border-t border-gray-200 dark:border-gray-700/50 p-6 bg-gray-50/50 dark:bg-gray-900/20"
            >
                <FormsPublicationForm
                  :project-id="projectId"
                  :publication="currentPublication"
                  @success="handleSuccess"
                  @cancel="handleCancel"
                />
            </div>
        </div>

        <!-- Linked Posts Section -->
        <div>
          <div v-if="currentPublication.posts && currentPublication.posts.length > 0">
              <div class="flex items-center gap-2 mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ t('publication.linkedPosts') }}
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

                <PostsPostCreateBlock 
                    v-if="isCreatingPost"
                    :publication="currentPublication"
                    :available-channels="availableChannels"
                    @success="handlePostCreated"
                    @cancel="isCreatingPost = false"
                />
              </div>
          </div>
          <div v-else class="text-center py-6 text-gray-500">
              <p>{{ t('publication.noPosts') }}</p>
               <PostsPostCreateBlock 
                    v-if="isCreatingPost"
                    :publication="currentPublication"
                    :available-channels="availableChannels"
                    class="mt-4"
                    @success="handlePostCreated"
                    @cancel="isCreatingPost = false"
                />
          </div>

          <div v-if="!isCreatingPost && availableChannels.length > 0" class="mt-4 flex justify-center">
            <UButton
                variant="ghost"
                color="primary"
                icon="i-heroicons-plus"
                @click="isCreatingPost = true"
            >
                {{ t('post.addPost', 'Add Post') }}
            </UButton>
          </div>
        </div>

        <!-- Delete Confirmation Modal (Moved inside conditional block) -->
        <UModal v-model="isDeleteModalOpen">
          <UCard>
            <template #header>
              <div class="flex items-center gap-3 text-red-600 dark:text-red-400">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6" />
                <h3 class="text-lg font-medium">
                  {{ t('publication.deleteConfirm') }}
                </h3>
              </div>
            </template>

            <p class="text-gray-500 dark:text-gray-400">
              {{ t('publication.deleteCascadeWarning') }}
            </p>

            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton
                  color="neutral"
                  variant="ghost"
                  :label="t('common.cancel')"
                  @click="isDeleteModalOpen = false"
                />
                <UButton
                  color="error"
                  :label="t('common.delete')"
                  :loading="isDeleting"
                  @click="handleDelete"
                />
              </div>
            </template>
          </UCard>
        </UModal>
    </div>
    
    <!-- Error/Not Found -->
    <div v-else class="text-center py-12">
        <p class="text-gray-500">{{ t('errors.notFound') }}</p>
    </div>
  </div>
</template>
