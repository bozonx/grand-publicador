<script setup lang="ts">
import { usePosts } from '~/composables/usePosts'
import type { PostWithRelations, PostStatus, PostType } from '~/composables/usePosts'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const router = useRouter()

const {
  posts,
  isLoading,
  pagination,
  totalCount,
  totalPages,
  statusOptions,
  typeOptions,
  fetchUserPosts,
  deletePost,
  setFilter,
  setPage,
} = usePosts()

// Filter states
const selectedStatus = ref<PostStatus | null>(null)
const selectedType = ref<PostType | null>(null)
const searchQuery = ref('')
const showDeletePostModal = ref(false)
const postToDelete = ref<PostWithRelations | null>(null)
const isDeletingPost = ref(false)

// Fetch all user posts on mount
onMounted(async () => {
    await fetchUserPosts()
})

// Watch filters
watch([selectedStatus, selectedType, searchQuery], () => {
    setFilter({
        status: selectedStatus.value || null,
        postType: selectedType.value || null,
        search: searchQuery.value || undefined
    })
    fetchUserPosts()
})

watch(
  () => pagination.value.page,
  () => {
    fetchUserPosts()
  }
)

/**
 * Handle Post Navigation
 */
function goToPost(post: PostWithRelations) {
  // We need to know the projectId to navigate correctly
  const projectId = post.channel?.projectId
  if (projectId) {
    router.push(`/projects/${projectId}/posts/${post.id}`)
  }
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
    fetchUserPosts()
  }
}

const statusFilterOptions = computed(() => [
  { value: null, label: t('common.all') },
  ...statusOptions.value,
])

const typeFilterOptions = computed(() => [
  { value: null, label: t('common.all') },
  ...typeOptions.value,
])

const hasActiveFilters = computed(() => {
  return selectedStatus.value || selectedType.value || searchQuery.value
})

</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('post.titlePlural') }} ({{ posts.length }})
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('navigation.posts') }}
        </p>
      </div>
    </div>

    <!-- Search and filters -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col md:flex-row gap-4">
      <div class="flex-1">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          :placeholder="t('common.search')"
          size="md"
          class="w-full"
        />
      </div>
      <div class="flex flex-col sm:flex-row gap-4">
        <USelectMenu
          v-model="selectedStatus"
          :items="statusFilterOptions"
          value-key="value"
          label-key="label"
          :placeholder="t('post.status')"
          class="w-full sm:w-48"
        />
        <USelectMenu
          v-model="selectedType"
          :items="typeFilterOptions"
          value-key="value"
          label-key="label"
          :placeholder="t('post.postType')"
          class="w-full sm:w-48"
        />
      </div>
    </div>

    <!-- Posts list -->
    <div v-if="isLoading && posts.length === 0" class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <div v-else-if="posts.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-document-text" class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ t('post.noPostsFound') }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400">
          {{ hasActiveFilters ? t('post.noPostsFiltered') : t('post.noPostsDescription') }}
        </p>
    </div>

    <div v-else class="space-y-4">
        <PostsPostListItem
          v-for="post in posts"
          :key="post.id"
          :post="post"
          show-channel-info
          @click="goToPost"
          @delete="confirmDeletePost"
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

    <!-- Delete Post Modal -->
    <UModal v-model:open="showDeletePostModal" :title="t('post.deletePost')">
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
