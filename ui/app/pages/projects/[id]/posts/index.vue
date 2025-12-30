<script setup lang="ts">
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

const {
  posts,
  isLoading,
  error,
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

const { channels, fetchChannels } = useChannels()

// Filter state
const selectedStatus = ref<PostStatusEnum | null>(null)
const selectedType = ref<PostTypeEnum | null>(null)
const selectedChannel = ref<string | null>(null)
const searchQuery = ref('')

// Delete modal state
const showDeleteModal = ref(false)
const postToDelete = ref<PostWithRelations | null>(null)
const isDeleting = ref(false)

// Fetch data on mount
onMounted(async () => {
  if (projectId.value) {
    await Promise.all([fetchChannels(projectId.value), fetchPostsByProject(projectId.value)])
  }
})

// Watch for filter changes
watch([selectedStatus, selectedType, selectedChannel, searchQuery], () => {
  setFilter({
    status: selectedStatus.value || null,
    postType: selectedType.value || null,
    channelId: selectedChannel.value || null,
    search: searchQuery.value || undefined,
  })
  fetchPostsByProject(projectId.value)
})

// Watch for route query changes (for sidebar navigation)
watch(
  () => route.query.channelId,
  (newChannelId) => {
    if (newChannelId) {
      selectedChannel.value = newChannelId as string
    } else {
      selectedChannel.value = null
    }
  },
  { immediate: true }
)

// Watch for page changes
watch(
  () => pagination.value.page,
  () => {
    fetchPostsByProject(projectId.value)
  }
)

// Channel options for filter
const channelOptions = computed(() => [
  { value: null, label: t('common.all') },
  ...channels.value.map((ch) => ({
    value: ch.id,
    label: ch.name,
  })),
])

// Status options with "All" option
const statusFilterOptions = computed(() => [
  { value: null, label: t('common.all') },
  ...statusOptions.value,
])

// Type options with "All" option
const typeFilterOptions = computed(() => [
  { value: null, label: t('common.all') },
  ...typeOptions.value,
])

/**
 * Navigate to create post page
 */
function goToCreatePost() {
  router.push(`/projects/${projectId.value}/posts/new`)
}

/**
 * Navigate to post detail page
 */
function goToPost(postId: string) {
  router.push(`/projects/${projectId.value}/posts/${postId}`)
}

/**
 * Navigate back to project
 */
function goBack() {
  router.push(`/projects/${projectId.value}`)
}

/**
 * Open delete confirmation modal
 */
function confirmDelete(post: PostWithRelations) {
  postToDelete.value = post
  showDeleteModal.value = true
}

/**
 * Handle post deletion
 */
async function handleDelete() {
  if (!postToDelete.value) return

  isDeleting.value = true
  const success = await deletePost(postToDelete.value.id)
  isDeleting.value = false

  if (success) {
    showDeleteModal.value = false
    postToDelete.value = null
    fetchPostsByProject(projectId.value)
  }
}

/**
 * Cancel delete
 */
function cancelDelete() {
  showDeleteModal.value = false
  postToDelete.value = null
}

/**
 * Reset all filters
 */
function resetFilters() {
  selectedStatus.value = null
  selectedType.value = null
  selectedChannel.value = null
  searchQuery.value = ''
  clearFilter()
  fetchPostsByProject(projectId.value)
}

/**
 * Format date for display
 */
function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

/**
 * Format datetime for display
 */
function formatDateTime(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

/**
 * Truncate content for preview
 */
function truncateContent(content: string, maxLength = 150): string {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Check if any filter is active
 */
const hasActiveFilters = computed(() => {
  return selectedStatus.value || selectedType.value || selectedChannel.value || searchQuery.value
})
</script>

<template>
  <div>
    <!-- Back button -->
    <div class="mb-6">
      <UButton variant="ghost" color="neutral" icon="i-heroicons-arrow-left" @click="goBack">
        {{ t('common.back') }}
      </UButton>
    </div>

    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('post.titlePlural') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ totalCount }} {{ t('post.titlePlural').toLowerCase() }}
        </p>
      </div>
      <UButton icon="i-heroicons-plus" color="primary" @click="goToCreatePost">
        {{ t('post.createPost') }}
      </UButton>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Search -->
        <UInput
          v-model="searchQuery"
          :placeholder="t('common.search')"
          icon="i-heroicons-magnifying-glass"
          class="lg:col-span-2"
        />

        <!-- Status filter -->
        <USelectMenu
          v-model="selectedStatus"
          :items="statusFilterOptions"
          value-key="value"
          label-key="label"
          :placeholder="t('post.status')"
        />

        <!-- Type filter -->
        <USelectMenu
          v-model="selectedType"
          :items="typeFilterOptions"
          value-key="value"
          label-key="label"
          :placeholder="t('post.postType')"
        />

        <!-- Channel filter -->
        <USelectMenu
          v-model="selectedChannel"
          :items="channelOptions"
          value-key="value"
          label-key="label"
          :placeholder="t('channel.title')"
        />
      </div>

      <!-- Reset filters button -->
      <div v-if="hasActiveFilters" class="mt-4">
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-heroicons-x-mark"
          @click="resetFilters"
        >
          {{ t('common.reset') }}
        </UButton>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <div class="flex items-center gap-3">
        <UIcon
          name="i-heroicons-exclamation-circle"
          class="w-5 h-5 text-red-600 dark:text-red-400"
        />
        <p class="text-red-700 dark:text-red-300">{{ error }}</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3"
        />
        <p class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="posts.length === 0"
      class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center"
    >
      <UIcon
        name="i-heroicons-document-text"
        class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('post.noPostsFound') }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{
          hasActiveFilters
            ? t('post.noPostsFiltered', 'No posts match your filters')
            : t('post.noPostsDescription', 'Create your first post to get started')
        }}
      </p>
      <UButton v-if="!hasActiveFilters" icon="i-heroicons-plus" @click="goToCreatePost">
        {{ t('post.createPost') }}
      </UButton>
    </div>

    <!-- Posts list -->
    <div v-else class="space-y-4">
      <div
        v-for="post in posts"
        :key="post.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        @click="goToPost(post.id)"
      >
        <div class="p-4 sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <!-- Title and status -->
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

              <!-- Content preview -->
              <p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                {{ truncateContent(post.content) }}
              </p>

              <!-- Meta info -->
              <div
                class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400"
              >
                <!-- Channel -->
                <span v-if="post.channel" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-signal" class="w-3.5 h-3.5" />
                  {{ post.channel.name }}
                </span>

                <!-- Author -->
                <span v-if="post.author" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-user" class="w-3.5 h-3.5" />
                  {{ post.author.fullName || post.author.username }}
                </span>

                <!-- Created date -->
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="w-3.5 h-3.5" />
                  {{ formatDate(post.createdAt) }}
                </span>

                <!-- Scheduled date -->
                <span
                  v-if="post.status === 'scheduled' && post.scheduledAt"
                  class="flex items-center gap-1 text-amber-600 dark:text-amber-400"
                >
                  <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                  {{ formatDateTime(post.scheduledAt) }}
                </span>

                <!-- Tags -->
                <div v-if="post.tags && post.tags.length > 0" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
                  <span
                    v-for="(tag, i) in post.tags.slice(0, 3)"
                    :key="tag"
                    class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs"
                  >
                    {{ tag }}{{ i < Math.min(post.tags.length, 3) - 1 ? '' : '' }}
                  </span>
                  <span v-if="post.tags.length > 3" class="text-gray-400">
                    +{{ post.tags.length - 3 }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
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
                @click="confirmDelete(post)"
              />
            </div>
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

    <!-- Delete confirmation modal -->
    <UModal v-model:open="showDeleteModal">
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
              :disabled="isDeleting"
              @click="cancelDelete"
            >
              {{ t('common.cancel') }}
            </UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">
              {{ t('common.delete') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
