<script setup lang="ts">
import type { ChannelWithProject } from '~/composables/useChannels'
import type { PostWithRelations } from '~/composables/usePosts'
import type { Database } from '~/types/database.types'

type PostStatusEnum = Database['public']['Enums']['post_status_enum']
type PostTypeEnum = Database['public']['Enums']['post_type_enum']

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const projectId = computed(() => route.params.id as string)
const channelId = computed(() => route.params.channelId as string)

const {
  fetchChannel,
  currentChannel: channel,
  isLoading: isChannelLoading,
  toggleChannelActive,
  getSocialMediaIcon,
  getSocialMediaColor,
  getSocialMediaDisplayName
} = useChannels()

const {
  posts,
  isLoading: isPostsLoading,
  error: postsError,
  pagination,
  totalCount,
  totalPages,
  statusOptions,
  typeOptions,
  fetchPostsByProject,
  deletePost,
  setFilter,
  clearFilter,
  setPage,
  getStatusDisplayName,
  getTypeDisplayName,
  getStatusColor,
  canDelete,
} = usePosts()

const { archiveEntity } = useArchive()
// We handle dynamic import for ArchiveEntityType inside the function or use a mapped string if needed, 
// but let's try to import it. If it fails due to top-level await in script setup in some envs, we'll handle it.
// However, Nuxt 3 supports top-level await.
const { ArchiveEntityType } = await import('~/types/archive.types')

// UI States
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isDeletingChannel = ref(false)

// Post Filter States
const selectedStatus = ref<PostStatusEnum | null>(null)
const selectedType = ref<PostTypeEnum | null>(null)
const searchQuery = ref('')
const showDeletePostModal = ref(false)
const postToDelete = ref<PostWithRelations | null>(null)
const isDeletingPost = ref(false)

// Initialization
onMounted(async () => {
    if (channelId.value) {
        await fetchChannel(channelId.value)
        // Set initial filter to this channel
        setFilter({ channelId: channelId.value })
        await fetchPostsByProject(projectId.value)
    }
})

// Watchers
watch([selectedStatus, selectedType, searchQuery], () => {
    setFilter({
        channelId: channelId.value,
        status: selectedStatus.value || null,
        postType: selectedType.value || null,
        search: searchQuery.value || undefined
    })
    fetchPostsByProject(projectId.value)
})

watch(
  () => pagination.value.page,
  () => {
    fetchPostsByProject(projectId.value)
  }
)

/**
 * Handle Channel Actions
 */
function handleUpdateSuccess() {
    isEditModalOpen.value = false
    fetchChannel(channelId.value)
}

async function handleToggleActive() {
    if (!channel.value) return
    await toggleChannelActive(channel.value.id)
}

async function handleDeleteChannel() {
    if (!channel.value) return
    isDeletingChannel.value = true
    try {
        await archiveEntity(ArchiveEntityType.CHANNEL, channel.value.id)
        router.push(`/projects/${projectId.value}`)
    } catch (e) {
        // handled in useArchive
    } finally {
        isDeletingChannel.value = false
        isDeleteModalOpen.value = false
    }
}

/**
 * Handle Post Navigation
 */
function goToCreatePost() {
  router.push({
      path: `/projects/${projectId.value}/posts/new`,
      query: { channelId: channelId.value }
  })
}

function goToPost(postId: string) {
  router.push(`/projects/${projectId.value}/posts/${postId}`)
}

function goBack() {
  router.push(`/projects/${projectId.value}`)
}

/**
 * Handle Post Deletion
 */
function confirmDeletePost(post: PostWithRelations) {
  postToDelete.value = post
  showDeletePostModal.value = true
}

async function handleDeletePost() {
  if (!postToDelete.value) return

  isDeletingPost.value = true
  const success = await deletePost(postToDelete.value.id)
  isDeletingPost.value = false

  if (success) {
    showDeletePostModal.value = false
    postToDelete.value = null
    fetchPostsByProject(projectId.value)
  }
}

// Option Lists
const statusFilterOptions = computed(() => [
  { value: null, label: t('common.all') },
  ...statusOptions.value,
])

const typeFilterOptions = computed(() => [
  { value: null, label: t('common.all') },
  ...typeOptions.value,
])

// Formatters
function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

function formatDateTime(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

function truncateContent(content: string, maxLength = 150): string {
  const text = content.replace(/<[^>]*>/g, '').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const hasActiveFilters = computed(() => {
  return selectedStatus.value || selectedType.value || searchQuery.value
})

function getStatusBadgeColor(isActive: boolean): 'success' | 'neutral' {
    return isActive ? 'success' : 'neutral'
}

</script>

<template>
    <div>
        <!-- Back Button -->
        <div class="mb-6">
            <UButton variant="ghost" color="neutral" icon="i-heroicons-arrow-left" @click="goBack">
                {{ t('common.back') }}
            </UButton>
        </div>

        <!-- Loading State -->
        <div v-if="isChannelLoading && !channel" class="flex items-center justify-center py-12">
            <div class="text-center">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                <p class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
            </div>
        </div>

        <!-- Channel Not Found -->
        <div v-else-if="!channel" class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
             <UIcon name="i-heroicons-signal-slash" class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
             <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {{ t('channel.notFound', 'Channel not found') }}
             </h3>
             <UButton @click="goBack">{{ t('common.back') }}</UButton>
        </div>

        <!-- Channel Content -->
        <div v-else class="space-y-6">
            <!-- Channel Info Panel -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <!-- Color bar -->
                <div class="h-2" :style="{ backgroundColor: getSocialMediaColor(channel.socialMedia) }" />
                
                <div class="p-6">
                    <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <!-- Main Info -->
                        <div class="flex items-start gap-4">
                            <div 
                                class="p-3 rounded-lg"
                                :style="{ backgroundColor: getSocialMediaColor(channel.socialMedia) + '20' }"
                            >
                                <UIcon 
                                    :name="getSocialMediaIcon(channel.socialMedia)" 
                                    class="w-8 h-8"
                                    :style="{ color: getSocialMediaColor(channel.socialMedia) }"
                                />
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {{ channel.name }}
                                </h1>
                                <div class="flex flex-wrap items-center gap-3">
                                    <UBadge :color="getStatusBadgeColor(channel.isActive)" variant="subtle">
                                        {{ channel.isActive ? t('channel.active') : t('channel.inactive') }}
                                    </UBadge>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">
                                        {{ getSocialMediaDisplayName(channel.socialMedia) }}
                                    </span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                        {{ channel.channelIdentifier }}
                                    </span>
                                </div>
                            </div>
                        </div>

                         <!-- Actions -->
                        <div class="flex flex-wrap items-center gap-2">
                            <UButton
                                color="neutral"
                                variant="outline"
                                icon="i-heroicons-pencil-square"
                                @click="isEditModalOpen = true"
                            >
                                {{ t('common.edit') }}
                            </UButton>
                            <UButton
                                :color="channel.isActive ? 'warning' : 'success'"
                                variant="outline"
                                :icon="channel.isActive ? 'i-heroicons-pause' : 'i-heroicons-play'"
                                @click="handleToggleActive"
                            >
                                {{ channel.isActive ? t('channel.deactivate') : t('channel.activate') }}
                            </UButton>
                             <UButton
                                color="error"
                                variant="outline"
                                icon="i-heroicons-trash"
                                @click="isDeleteModalOpen = true"
                            >
                                {{ t('project.moveToArchive') || t('common.delete') }}
                            </UButton>
                        </div>
                    </div>

                    <!-- Stats -->
                    <div class="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 dark:border-gray-700 pt-6">
                         <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">{{ t('post.titlePlural') }}</p>
                            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ channel.postsCount || 0 }}</p>
                         </div>
                         <!-- We could add more stats here if available, e.g. followers count if sync implemented -->
                    </div>
                </div>
            </div>

            <!-- Posts Panel -->
             <div>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                        {{ t('post.titlePlural') }}
                    </h2>
                     <UButton icon="i-heroicons-plus" color="primary" @click="goToCreatePost">
                        {{ t('post.createPost') }}
                    </UButton>
                </div>

                <!-- Filters -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <UInput
                            v-model="searchQuery"
                            :placeholder="t('common.search')"
                            icon="i-heroicons-magnifying-glass"
                            class="lg:col-span-2"
                        />
                        <USelectMenu
                            v-model="selectedStatus"
                            :items="statusFilterOptions"
                            value-key="value"
                            label-key="label"
                            :placeholder="t('post.status')"
                        />
                        <USelectMenu
                            v-model="selectedType"
                            :items="typeFilterOptions"
                            value-key="value"
                            label-key="label"
                            :placeholder="t('post.postType')"
                        />
                    </div>
                </div>

                <!-- Posts List -->
                <div v-if="isPostsLoading" class="flex items-center justify-center py-12">
                     <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
                </div>

                <div v-else-if="posts.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <p class="text-gray-500 dark:text-gray-400">
                        {{ hasActiveFilters ? t('post.noPostsFiltered') : t('channel.noPostsDescription') }}
                    </p>
                </div>

                <div v-else class="space-y-4">
                    <div
                        v-for="post in posts"
                        :key="post.id"
                        class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-4 sm:p-6"
                        @click="goToPost(post.id)"
                    >
                         <div class="flex items-start justify-between gap-4">
                             <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-3 mb-2">
                                    <h3 class="text-lg font-medium text-gray-900 dark:text-white truncate">
                                    {{ post.title || t('post.untitled', 'Untitled') }}
                                    </h3>
                                    <UBadge :color="getStatusColor(post.status)" size="xs" variant="subtle">
                                    {{ getStatusDisplayName(post.status) }}
                                    </UBadge>
                                    <UBadge color="neutral" size="xs" variant="outline">
                                    {{ getTypeDisplayName(post.postType) }}
                                    </UBadge>
                                </div>
                                <p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                                    {{ truncateContent(post.content) }}
                                </p>
                                <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <span class="flex items-center gap-1">
                                        <UIcon name="i-heroicons-calendar" class="w-3.5 h-3.5" />
                                        {{ formatDate(post.createdAt) }}
                                    </span>
                                    <span
                                        v-if="post.status === 'scheduled' && post.scheduledAt"
                                        class="flex items-center gap-1 text-amber-600 dark:text-amber-400"
                                    >
                                        <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                                        {{ formatDateTime(post.scheduledAt) }}
                                    </span>
                                </div>
                             </div>
                             
                             <div class="flex items-center gap-2" @click.stop>
                                <UButton
                                    color="neutral"
                                    variant="ghost"
                                    icon="i-heroicons-pencil-square"
                                    size="sm"
                                    @click="goToPost(post.id)"
                                />
                                <UButton
                                    v-if="canDelete(post)"
                                    color="error"
                                    variant="ghost"
                                    icon="i-heroicons-trash"
                                    size="sm"
                                    @click="confirmDeletePost(post)"
                                />
                            </div>
                         </div>
                    </div>
                </div>
                 <!-- Pagination -->
                <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
                    <UButton
                        :disabled="pagination.page <= 1"
                        variant="outline"
                        color="neutral"
                        icon="i-heroicons-chevron-left"
                        size="sm"
                        @click="setPage(pagination.page - 1)"
                    />
                    <span class="text-sm text-gray-600 dark:text-gray-400 px-4">
                        {{ pagination.page }} / {{ totalPages }}
                    </span>
                    <UButton
                        :disabled="pagination.page >= totalPages"
                        variant="outline"
                        color="neutral"
                        icon="i-heroicons-chevron-right"
                        size="sm"
                        @click="setPage(pagination.page + 1)"
                    />
                </div>
             </div>
        </div>

        <!-- Edit Modal -->
        <UModal v-model:open="isEditModalOpen">
            <template #content>
                <div class="p-6">
                    <FormsChannelForm
                        v-if="channel"
                        :project-id="projectId"
                        :channel="channel"
                        @success="handleUpdateSuccess"
                        @cancel="isEditModalOpen = false"
                    />
                </div>
            </template>
        </UModal>

        <!-- Archive/Delete Channel Modal -->
        <UModal v-model:open="isDeleteModalOpen">
             <template #content>
                <div class="p-6">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            {{ t('project.moveToArchive') || t('channel.deleteChannel') }}
                        </h3>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        {{ t('channel.deleteConfirm') }}
                    </p>
                    <div class="flex justify-end gap-3">
                        <UButton color="neutral" variant="ghost" :disabled="isDeletingChannel" @click="isDeleteModalOpen = false">
                             {{ t('common.cancel') }}
                        </UButton>
                        <UButton color="error" :loading="isDeletingChannel" @click="handleDeleteChannel">
                             {{ t('project.moveToArchive') || t('common.delete') }}
                        </UButton>
                    </div>
                </div>
             </template>
        </UModal>

        <!-- Delete Post Modal -->
         <UModal v-model:open="showDeletePostModal">
            <template #content>
                <div class="p-6">
                <div class="flex items-center gap-4 mb-4">
                    <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <UIcon
                        name="i-heroicons-exclamation-triangle"
                        class="w-6 h-6 text-red-600 dark:text-red-400"
                    />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ t('post.deletePost') }}
                    </h3>
                </div>

                <p class="text-gray-600 dark:text-gray-400 mb-6">
                    {{ t('post.deleteConfirm') }}
                </p>

                <div class="flex justify-end gap-3">
                    <UButton
                    color="neutral"
                    variant="ghost"
                    :disabled="isDeletingPost"
                    @click="showDeletePostModal = false"
                    >
                    {{ t('common.cancel') }}
                    </UButton>
                    <UButton color="error" :loading="isDeletingPost" @click="handleDeletePost">
                    {{ t('common.delete') }}
                    </UButton>
                </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
