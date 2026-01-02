<script setup lang="ts">
import { useProjects } from '~/composables/useProjects'
import { usePublications } from '~/composables/usePublications'
import { useChannels } from '~/composables/useChannels'
import { usePosts } from '~/composables/usePosts'

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
  toggleArchive,
  updatePublication 
} = usePublications()
const { fetchChannels, channels } = useChannels()
const { canGoBack, goBack } = useNavigation()

const projectId = computed(() => route.params.id as string)
const publicationId = computed(() => route.params.publicationId as string)

const isCreatingPost = ref(false)
const isFormCollapsed = ref(true)
const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)

const { updatePost } = usePosts()
const toast = useToast()
const isScheduleModalOpen = ref(false)
const newScheduledDate = ref('')
const isBulkScheduling = ref(false)

// Determine available channels (in project but not yet in publication)
const availableChannels = computed(() => {
    if (!channels.value || !currentPublication.value) return []
    const usedChannelIds = currentPublication.value.posts?.map((p: any) => p.channelId) || []
    return channels.value.filter(ch => !usedChannelIds.includes(ch.id))
})

const allPostsPublished = computed(() => {
    if (!currentPublication.value?.posts?.length) return false
    return currentPublication.value.posts.every((p: any) => !!p.publishedAt)
})

const majoritySchedule = computed(() => {
    if (!currentPublication.value?.posts?.length) return { date: null, conflict: false }
    
    // Collect dates: prefer scheduledAt, then publishedAt
    const dates = currentPublication.value.posts
        .map((p: any) => p.scheduledAt || p.publishedAt)
        .filter((d: string | null) => !!d) as string[]

    if (dates.length === 0) return { date: null, conflict: false }

    const counts: Record<string, number> = {}
    dates.forEach(d => {
        counts[d] = (counts[d] || 0) + 1
    })

    let maxCount = 0
    let majorityDate = null
    
    for (const [date, count] of Object.entries(counts)) {
        if (count > maxCount) {
            maxCount = count
            majorityDate = date
        }
    }

    const uniqueDates = Object.keys(counts)
    const conflict = uniqueDates.length > 1
    
    return { date: majorityDate, conflict }
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
 * Handle post deletion
 */
async function handlePostDeleted() {
    // Refresh publication to remove deleted post
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

function openScheduleModal() {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()) // Adjust for local input
    newScheduledDate.value = now.toISOString().slice(0, 16)
    isScheduleModalOpen.value = true
}

async function handleBulkSchedule() {
    if (!currentPublication.value?.posts?.length) return
    if (!newScheduledDate.value) return

    isBulkScheduling.value = true
    try {
        const postsToUpdate = currentPublication.value.posts.filter((post: any) => !post.publishedAt)
        
        if (postsToUpdate.length === 0) {
            isBulkScheduling.value = false
            return
        }

        const promises = postsToUpdate.map((post: any) => 
            updatePost(post.id, { 
                scheduledAt: new Date(newScheduledDate.value).toISOString(),
                status: 'SCHEDULED' 
            }, { silent: true })
        )
        
        // Update publication status as well
        const publicationPromise = updatePublication(currentPublication.value.id, {
            status: 'SCHEDULED'
        })
        
        await Promise.all([...promises, publicationPromise])
        
        toast.add({
            title: t('common.success'),
            description: t('publication.scheduleUpdated'),
            color: 'success'
        })

        isScheduleModalOpen.value = false
        // Refresh publication
        if (currentPublication.value) {
            await fetchPublication(currentPublication.value.id)
        }
    } finally {
        isBulkScheduling.value = false
    }
}

// Language and Type Editing
const { languageOptions } = useLanguages()
const { typeOptions } = usePosts()

const isLanguageModalOpen = ref(false)
const isTypeModalOpen = ref(false)
const newLanguage = ref('')
const newPostType = ref<PostType>('POST')
const isUpdatingLanguage = ref(false)
const isUpdatingType = ref(false)

function openLanguageModal() {
    if (!currentPublication.value) return
    newLanguage.value = currentPublication.value.language
    isLanguageModalOpen.value = true
}

function openTypeModal() {
    if (!currentPublication.value) return
    newPostType.value = currentPublication.value.postType as PostType
    isTypeModalOpen.value = true
}

async function handleUpdateLanguage() {
    if (!currentPublication.value) return
    isUpdatingLanguage.value = true
    try {
        await updatePublication(currentPublication.value.id, {
            language: newLanguage.value
        })
        toast.add({ title: t('common.success'), color: 'success' })
        isLanguageModalOpen.value = false
        await fetchPublication(currentPublication.value.id)
    } finally {
        isUpdatingLanguage.value = false
    }
}

async function handleUpdateType() {
    if (!currentPublication.value) return
    isUpdatingType.value = true
    try {
        await updatePublication(currentPublication.value.id, {
            postType: newPostType.value
        })
        toast.add({ title: t('common.success'), color: 'success' })
        isTypeModalOpen.value = false
        await fetchPublication(currentPublication.value.id)
    } finally {
        isUpdatingType.value = false
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
    <!-- Delete Confirmation Modal (Moved to top level for better portal handling) -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6"></UIcon>
            <h3 class="text-lg font-medium">
              {{ t('publication.deleteConfirm') }}
            </h3>
          </div>

          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ t('publication.deleteCascadeWarning') }}
          </p>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :label="t('common.cancel')"
              @click="isDeleteModalOpen = false"
            ></UButton>
            <UButton
              color="error"
              :label="t('common.delete')"
              :loading="isDeleting"
              @click="handleDelete"
            ></UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Schedule Modal -->
    <UModal v-model:open="isScheduleModalOpen">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-3 text-gray-900 dark:text-white mb-4">
            <UIcon name="i-heroicons-clock" class="w-6 h-6 text-primary-500"></UIcon>
            <h3 class="text-lg font-medium">
              {{ t('publication.changeScheduleTitle') }}
            </h3>
          </div>

          <p class="text-gray-500 dark:text-gray-400 mb-4">
            {{ t('publication.changeScheduleWarning') }}
          </p>

          <UFormField :label="t('publication.newScheduleTime')" required class="mb-6">
            <UInput v-model="newScheduledDate" type="datetime-local" class="w-full" icon="i-heroicons-clock" />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :label="t('common.cancel')"
              @click="isScheduleModalOpen = false"
            ></UButton>
            <UButton
              color="primary"
              :label="t('common.save')"
              :loading="isBulkScheduling"
              @click="handleBulkSchedule"
            ></UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Language Change Modal -->
    <UModal v-model:open="isLanguageModalOpen">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-3 text-gray-900 dark:text-white mb-4">
            <UIcon name="i-heroicons-language" class="w-6 h-6 text-primary-500"></UIcon>
            <h3 class="text-lg font-medium">
              {{ t('publication.changeLanguage') }}
            </h3>
          </div>

          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ t('publication.changeLanguageWarning') }}
          </p>

          <UFormField :label="t('common.language')" required class="mb-6">
             <USelectMenu
                v-model="newLanguage"
                :items="languageOptions"
                value-key="value"
                label-key="label"
                class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :label="t('common.cancel')"
              @click="isLanguageModalOpen = false"
            ></UButton>
            <UButton
              color="primary"
              :label="t('common.save')"
              :loading="isUpdatingLanguage"
              @click="handleUpdateLanguage"
            ></UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Post Type Change Modal -->
    <UModal v-model:open="isTypeModalOpen">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-3 text-gray-900 dark:text-white mb-4">
            <UIcon name="i-heroicons-document-duplicate" class="w-6 h-6 text-primary-500"></UIcon>
            <h3 class="text-lg font-medium">
              {{ t('publication.changeType') }}
            </h3>
          </div>

          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ t('publication.changeTypeWarning') }}
          </p>

          <UFormField :label="t('post.postType')" required class="mb-6">
             <USelectMenu
                v-model="newPostType"
                :items="typeOptions"
                value-key="value"
                label-key="label"
                class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :label="t('common.cancel')"
              @click="isTypeModalOpen = false"
            ></UButton>
            <UButton
              color="primary"
              :label="t('common.save')"
              :loading="isUpdatingType"
              @click="handleUpdateType"
            ></UButton>
          </div>
        </div>
      </template>
    </UModal>

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
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin"></UIcon>
    </div>

    <div v-else-if="currentPublication" class="space-y-6 pb-12">
        <!-- Block 1: Publication Info & Actions (Non-collapsible) -->
        <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800/50 overflow-hidden shadow-sm">
            <div class="p-6">
                <!-- Header with title and actions -->
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-500"></UIcon>
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
                        ></UButton>

                        <UButton
                            :label="t('publication.changeSchedule')"
                            icon="i-heroicons-clock"
                            variant="soft"
                            size="sm"
                            color="primary"
                            :disabled="allPostsPublished"
                            @click="openScheduleModal"
                        ></UButton>

                        <UButton
                            :label="t('common.delete')"
                            icon="i-heroicons-trash"
                            variant="soft"
                            size="sm"
                            color="error"
                            @click="isDeleteModalOpen = true"
                        ></UButton>
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
                        <div v-if="currentPublication.creator" class="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                            {{ currentPublication.creator.fullName || currentPublication.creator.telegramUsername || t('common.unknown') }}
                        </div>
                        
                        <div v-if="majoritySchedule.date" class="mt-2 border-t border-gray-100 dark:border-gray-700/50 pt-2">
                             <div class="text-gray-500 dark:text-gray-400 text-xs mb-0.5">
                                {{ t('post.scheduledAt') }}
                             </div>
                             <div class="flex items-center gap-2">
                                 <span class="text-gray-900 dark:text-white font-medium">
                                      {{ formatDate(majoritySchedule.date) }}
                                 </span>
                                 <UTooltip v-if="majoritySchedule.conflict" :text="t('publication.multipleDatesWarning')">
                                     <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-orange-500 cursor-help" />
                                 </UTooltip>
                             </div>
                        </div>
                    </div>

                    <!-- Language and Type Column -->
                    <div class="space-y-4">
                        <!-- Language -->
                        <div>
                            <div class="text-gray-500 dark:text-gray-400 mb-1 text-xs">
                                {{ t('common.language') }}
                            </div>
                            <div class="flex items-center gap-2">
                                <UIcon name="i-heroicons-language" class="w-5 h-5 text-gray-400" />
                                <span class="text-gray-900 dark:text-white font-medium text-base">
                                    {{ languageOptions.find(l => l.value === currentPublication.language)?.label || currentPublication.language }}
                                </span>
                                <UButton
                                    icon="i-heroicons-pencil-square"
                                    variant="ghost"
                                    color="neutral"
                                    size="xs"
                                    class="ml-1 text-gray-400 hover:text-primary-500 transition-colors"
                                    @click="openLanguageModal"
                                />
                            </div>
                        </div>

                         <!-- Type -->
                        <div>
                            <div class="text-gray-500 dark:text-gray-400 mb-1 text-xs">
                                {{ t('post.postType') }}
                            </div>
                            <div class="flex items-center gap-2">
                                <UIcon name="i-heroicons-document-duplicate" class="w-5 h-5 text-gray-400" />
                                <span class="text-gray-900 dark:text-white font-medium text-base">
                                    {{ typeOptions.find(t => t.value === currentPublication.postType)?.label || currentPublication.postType }}
                                </span>
                                <UButton
                                    icon="i-heroicons-pencil-square"
                                    variant="ghost"
                                    color="neutral"
                                    size="xs"
                                    class="ml-1 text-gray-400 hover:text-primary-500 transition-colors"
                                    @click="openTypeModal"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Archived info (if archived) -->
                    <div v-if="currentPublication.archivedAt" class="md:col-span-2">
                        <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                            <div class="flex items-center gap-2 mb-1">
                                <UIcon name="i-heroicons-archive-box" class="w-4 h-4 text-yellow-600 dark:text-yellow-400"></UIcon>
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
                    <UIcon name="i-heroicons-pencil-square" class="w-5 h-5 text-gray-500"></UIcon>
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
                ></UButton>
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
                ></FormsPublicationForm>
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
                  @deleted="handlePostDeleted"
                ></PostsPostEditBlock>

                <PostsPostEditBlock 
                    v-if="isCreatingPost"
                    is-creating
                    :publication="currentPublication"
                    :available-channels="availableChannels"
                    @success="handlePostCreated"
                    @cancel="isCreatingPost = false"
                ></PostsPostEditBlock>
              </div>
          </div>
          <div v-else class="text-center py-6 text-gray-500">
              <p>{{ t('publication.noPosts') }}</p>
               <PostsPostEditBlock 
                    v-if="isCreatingPost"
                    is-creating
                    :publication="currentPublication"
                    :available-channels="availableChannels"
                    class="mt-4"
                    @success="handlePostCreated"
                    @cancel="isCreatingPost = false"
                ></PostsPostEditBlock>
          </div>

          <div v-if="!isCreatingPost && availableChannels.length > 0" class="mt-4 flex justify-center">
            <UButton
                variant="ghost"
                color="primary"
                icon="i-heroicons-plus"
                @click="isCreatingPost = true"
            >
                {{ t('post.addPost') }}
            </UButton>
          </div>
        </div>
    </div>
    
    <!-- Error/Not Found -->
    <div v-else class="text-center py-12">
        <p class="text-gray-500">{{ t('errors.notFound') }}</p>
    </div>
  </div>
</template>
