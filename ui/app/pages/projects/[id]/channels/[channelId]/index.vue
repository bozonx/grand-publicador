<script setup lang="ts">
import type { ChannelWithProject } from '~/composables/useChannels'
import type { PostWithRelations, PostStatus, PostType } from '~/composables/usePosts'
import type { PublicationWithRelations, PublicationStatus } from '~/composables/usePublications'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { canGoBack, goBack: navigateBack } = useNavigation()

const projectId = computed(() => route.params.id as string)
const channelId = computed(() => route.params.channelId as string)

const {
  fetchChannel,
  currentChannel: channel,
  isLoading: isChannelLoading,
  getSocialMediaIcon,
  getSocialMediaColor,
  getSocialMediaDisplayName,
  toggleChannelActive,
  unarchiveChannel,
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

// Post Filter States
const selectedStatus = ref<PostStatus | null>(null)
const selectedType = ref<PostType | null>(null)
const searchQuery = ref('')
const showDeletePostModal = ref(false)
const postToDelete = ref<PostWithRelations | null>(null)
const isDeletingPost = ref(false)
const isTogglingActive = ref(false)
const isArchiving = ref(false)

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
 * Handle Post Navigation
 */
function goToCreatePost() {
  router.push({
      path: `/projects/${projectId.value}/publications/new`,
      query: { channelId: channelId.value }
  })
}

function goToPost(postId: string) {
  // Find the post to get its publicationId
  const post = posts.value.find(p => p.id === postId)
  if (post?.publicationId) {
    router.push(`/projects/${projectId.value}/publications/${post.publicationId}`)
  }
}

function goBack() {
  navigateBack()
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
/**
 * Handle channel activation/deactivation from banner
 */
async function handleToggleActive() {
    if (!channel.value) return
    isTogglingActive.value = true
    try {
        await toggleChannelActive(channel.value.id)
    } finally {
        isTogglingActive.value = false
    }
}

/**
 * Handle channel unarchiving from banner
 */
async function handleUnarchive() {
    if (!channel.value) return
    isArchiving.value = true
    try {
        await unarchiveChannel(channel.value.id)
    } finally {
        isArchiving.value = false
    }
}

// Formatters
function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

function formatDateTime(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

function truncateContent(content: string | null | undefined, maxLength = 150): string {
  if (!content) return ''
  const text = content.replace(/<[^>]*>/g, '').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const hasActiveFilters = computed(() => {
  return selectedStatus.value || selectedType.value || searchQuery.value
})

function mapPostToPublication(post: PostWithRelations): PublicationWithRelations {
  const basePublication = post.publication || {
     id: post.publicationId,
     projectId: post.channel?.projectId || '',
     title: t('post.untitled'),
     content: '',
     status: 'DRAFT',
     language: 'ru-RU',
     postType: 'POST',
     mediaFiles: '[]',
     meta: '{}',
     createdAt: post.createdAt, 
     updatedAt: post.updatedAt,
     createdBy: null,
     archivedAt: null,
     archivedBy: null,
     tags: post.tags,
     description: null,
     authorComment: null,
     postDate: null,
     translationGroupId: null
  }

  // Create a minimal creator object if ID exists, to avoid errors if component checks it
  const creator = basePublication.createdBy ? { id: basePublication.createdBy } as any : undefined

  return {
      ...basePublication,
      // Visualize the Post's status as the Publication's status in this view
      status: (post.status as unknown) as PublicationStatus, 
      createdAt: post.createdAt,
      posts: [post],
      _count: { posts: 1 },
      creator
  } as PublicationWithRelations
}



</script>

<template>
    <div>
        <!-- Back Button -->
        <div class="mb-6">
            <UButton 
              variant="ghost" 
              color="neutral" 
              icon="i-heroicons-arrow-left" 
              :disabled="!canGoBack"
              @click="goBack"
            >
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
            <!-- Channel Header -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <!-- Color bar -->
                <div class="h-2" :style="{ backgroundColor: getSocialMediaColor(channel.socialMedia) }" />
                
                <div class="p-6">
                    <div class="flex items-start justify-between">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-3 mb-2">
                                <div 
                                    class="p-2 rounded-lg"
                                    :style="{ backgroundColor: getSocialMediaColor(channel.socialMedia) + '20' }"
                                >
                                    <UIcon 
                                        :name="getSocialMediaIcon(channel.socialMedia)" 
                                        class="w-6 h-6"
                                        :style="{ color: getSocialMediaColor(channel.socialMedia) }"
                                    />
                                </div>
                                <h1 class="text-2xl font-bold text-gray-900 dark:text-white truncate">
                                    {{ channel.name }}
                                </h1>
                                <div class="flex items-center gap-1 text-gray-500 dark:text-gray-400" :title="t('channel.language')">
                                    <UIcon name="i-heroicons-language" class="w-5 h-5" />
                                    <span class="text-sm font-medium">{{ channel.language }}</span>
                                </div>
                            </div>

                            <div
                                class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400"
                            >
                                <span class="flex items-center gap-1">
                                    <UIcon name="i-heroicons-signal" class="w-4 h-4" />
                                    {{ getSocialMediaDisplayName(channel.socialMedia) }}
                                </span>
                                <span class="flex items-center gap-1 font-mono">
                                    <UIcon name="i-heroicons-hashtag" class="w-4 h-4" />
                                    {{ channel.channelIdentifier }}
                                </span>
                                <NuxtLink 
                                    v-if="channel.project"
                                    :to="`/projects/${channel.project.id}`"
                                    class="flex items-center gap-1 hover:text-primary-500 transition-colors"
                                    :title="t('project.title')"
                                >
                                    <UIcon name="i-heroicons-folder" class="w-4 h-4" />
                                    {{ channel.project.name }}
                                </NuxtLink>
                                <span class="flex items-center gap-1" :title="t('channel.publishedPosts')">
                                    <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
                                    {{ t('channel.publishedPosts') }}: {{ channel.postsCount || 0 }}
                                </span>
                                <span v-if="channel.lastPostAt" class="flex items-center gap-1" :title="t('channel.lastPublishedPost')">
                                    <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                                    {{ t('channel.lastPublishedPost') }}:
                                    <NuxtLink 
                                        v-if="channel.lastPublicationId"
                                        :to="`/projects/${projectId}/publications/${channel.lastPublicationId}`"
                                        class="hover:underline hover:text-primary-500 font-medium relative z-10"
                                    >
                                        {{ formatDateTime(channel.lastPostAt) }}
                                    </NuxtLink>
                                    <span v-else>
                                        {{ formatDateTime(channel.lastPostAt) }}
                                    </span>
                                </span>
                            </div>

                            <p 
                                v-if="channel.description" 
                                class="mt-4 text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed"
                            >
                                {{ channel.description }}
                            </p>
                        </div>

                        <!-- Actions -->
                        <div class="flex items-center gap-2 ml-4">
                            <UButton
                                color="neutral"
                                variant="ghost"
                                icon="i-heroicons-cog-6-tooth"
                                :to="`/projects/${projectId}/channels/${channelId}/settings`"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Archived Status Banner -->
            <div 
                v-if="channel.archivedAt" 
                class="bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4"
            >
                <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-neutral-200 dark:bg-neutral-800 rounded-full">
                            <UIcon name="i-heroicons-archive-box" class="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ t('channel.archived_notice', 'Channel is archived') }}
                            </p>
                            <p class="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5">
                                {{ t('channel.archived_info_banner', 'Archived channels are hidden from the project but their history is preserved.') }}
                            </p>
                        </div>
                    </div>
                    <UButton 
                        size="sm" 
                        color="primary" 
                        variant="solid" 
                        :loading="isArchiving"
                        @click="handleUnarchive"
                    >
                        {{ t('channel.unarchive') }}
                    </UButton>
                </div>
            </div>

            <!-- Deactivated Status Banner -->
            <div 
                v-else-if="!channel.isActive" 
                class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
            >
                <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                            <UIcon name="i-heroicons-pause-circle" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                {{ t('channel.deactivated_notice', 'Channel is deactivated') }}
                            </p>
                            <p class="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                {{ t('channel.deactivate_warning', 'Deactivating the channel will stop all scheduled posts.') }}
                            </p>
                        </div>
                    </div>
                    <UButton 
                        size="sm" 
                        color="warning" 
                        variant="solid" 
                        :loading="isTogglingActive"
                        @click="handleToggleActive"
                    >
                        {{ t('channel.activate') }}
                    </UButton>
                </div>
            </div>

            <!-- Posts Panel -->
             <div>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                        {{ t('publication.titlePlural', 'Publications') }}
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
                    <PublicationsPublicationListItem
                        v-for="post in posts"
                        :key="post.id"
                        :publication="mapPostToPublication(post)"
                        @click="goToPost(post.id)"
                        @delete="confirmDeletePost(post)"
                    />
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
