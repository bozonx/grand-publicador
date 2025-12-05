<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const blogId = computed(() => route.params.id as string)
const postId = computed(() => route.params.postId as string)

const { 
  currentPost, 
  isLoading, 
  error, 
  fetchPost, 
  deletePost,
  clearCurrentPost,
  getStatusDisplayName,
  getStatusColor,
  getTypeDisplayName,
  canEdit,
  canDelete 
} = usePosts()

// UI state
const isEditMode = computed(() => route.query.edit === 'true')
const showDeleteModal = ref(false)
const isDeleting = ref(false)

// Fetch post on mount
onMounted(async () => {
  if (postId.value) {
    await fetchPost(postId.value)
  }
})

// Cleanup
onUnmounted(() => {
  clearCurrentPost()
})

/**
 * Navigate back to posts list
 */
function goBack() {
  router.push(`/blogs/${blogId.value}/posts`)
}

/**
 * Toggle edit mode
 */
function toggleEditMode() {
  router.replace({
    query: { ...route.query, edit: isEditMode.value ? undefined : 'true' }
  })
}

/**
 * Handle successful update
 */
function handleSuccess() {
  router.replace({
    query: { ...route.query, edit: undefined }
  })
  fetchPost(postId.value)
}

/**
 * Handle cancel edit
 */
function handleCancel() {
  router.replace({
    query: { ...route.query, edit: undefined }
  })
}

/**
 * Confirm delete
 */
function confirmDelete() {
  showDeleteModal.value = true
}

/**
 * Handle delete
 */
async function handleDelete() {
  isDeleting.value = true
  const success = await deletePost(postId.value)
  isDeleting.value = false
  
  if (success) {
    showDeleteModal.value = false
    router.push(`/blogs/${blogId.value}/posts`)
  }
}

/**
 * Format date
 */
function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

/**
 * Format datetime
 */
function formatDateTime(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}
</script>

<template>
  <div>
    <!-- Back button -->
    <div class="mb-6">
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-heroicons-arrow-left"
        @click="goBack"
      >
        {{ t('common.back') }}
      </UButton>
    </div>

    <!-- Error state -->
    <div v-if="error" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-red-600 dark:text-red-400" />
        <p class="text-red-700 dark:text-red-300">{{ error }}</p>
      </div>
      <div class="mt-4">
        <UButton variant="outline" color="neutral" @click="goBack">
          {{ t('common.back') }}
        </UButton>
      </div>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Post not found -->
    <div v-else-if="!currentPost" class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
      <UIcon name="i-heroicons-document-magnifying-glass" class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('errors.notFound') }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{ t('post.notFoundDescription', 'The post you\'re looking for doesn\'t exist or you don\'t have access to it.') }}
      </p>
      <UButton @click="goBack">
        {{ t('common.back') }}
      </UButton>
    </div>

    <!-- Edit mode -->
    <div v-else-if="isEditMode && canEdit(currentPost)">
      <FormsPostForm
        :blog-id="blogId"
        :post="currentPost"
        @success="handleSuccess"
        @cancel="handleCancel"
      />
    </div>

    <!-- View mode -->
    <div v-else>
      <!-- Post header -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div class="p-6">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <!-- Title and badges -->
              <div class="flex flex-wrap items-center gap-3 mb-3">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ currentPost.title || t('post.untitled', 'Untitled') }}
                </h1>
                <UBadge 
                  :color="getStatusColor(currentPost.status)" 
                  variant="subtle"
                >
                  {{ getStatusDisplayName(currentPost.status) }}
                </UBadge>
                <UBadge 
                  color="neutral" 
                  variant="outline"
                >
                  {{ getTypeDisplayName(currentPost.post_type) }}
                </UBadge>
              </div>

              <!-- Meta info -->
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <!-- Channel -->
                <span v-if="currentPost.channel" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-signal" class="w-4 h-4" />
                  {{ currentPost.channel.name }}
                </span>
                
                <!-- Author -->
                <span v-if="currentPost.author" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-user" class="w-4 h-4" />
                  {{ currentPost.author.full_name || currentPost.author.username }}
                </span>
                
                <!-- Created date -->
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                  {{ t('post.createdAt', 'Created') }}: {{ formatDate(currentPost.created_at) }}
                </span>

                <!-- Scheduled date -->
                <span 
                  v-if="currentPost.status === 'scheduled' && currentPost.scheduled_at" 
                  class="flex items-center gap-1 text-amber-600 dark:text-amber-400"
                >
                  <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                  {{ t('post.scheduledAt') }}: {{ formatDateTime(currentPost.scheduled_at) }}
                </span>

                <!-- Published date -->
                <span 
                  v-if="currentPost.status === 'published' && currentPost.published_at" 
                  class="flex items-center gap-1 text-green-600 dark:text-green-400"
                >
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                  {{ t('post.publishedAt') }}: {{ formatDateTime(currentPost.published_at) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <UButton
                v-if="canEdit(currentPost)"
                color="primary"
                variant="outline"
                icon="i-heroicons-pencil-square"
                @click="toggleEditMode"
              >
                {{ t('common.edit') }}
              </UButton>
              <UButton
                v-if="canDelete(currentPost)"
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                @click="confirmDelete"
              >
                {{ t('common.delete') }}
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Post content -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('post.content') }}
          </h2>
        </div>
        <div class="p-6">
          <div 
            class="prose prose-sm dark:prose-invert max-w-none"
            v-html="currentPost.content"
          />
        </div>
      </div>

      <!-- Additional info -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('post.details', 'Details') }}
          </h2>
        </div>
        <div class="p-6">
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Description -->
            <div v-if="currentPost.description">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {{ t('post.description') }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ currentPost.description }}
              </dd>
            </div>

            <!-- Author comment -->
            <div v-if="currentPost.author_comment">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {{ t('post.authorComment') }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white italic">
                {{ currentPost.author_comment }}
              </dd>
            </div>

            <!-- Tags -->
            <div v-if="currentPost.tags && currentPost.tags.length > 0">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {{ t('post.tags') }}
              </dt>
              <dd class="flex flex-wrap gap-2">
                <UBadge 
                  v-for="tag in currentPost.tags" 
                  :key="tag"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                >
                  {{ tag }}
                </UBadge>
              </dd>
            </div>

            <!-- Post date -->
            <div v-if="currentPost.post_date">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {{ t('post.postDate') }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ formatDate(currentPost.post_date) }}
              </dd>
            </div>

            <!-- Last updated -->
            <div v-if="currentPost.updated_at">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {{ t('post.updatedAt', 'Last updated') }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ formatDateTime(currentPost.updated_at) }}
              </dd>
            </div>

            <!-- Social media type -->
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {{ t('channel.socialMedia') }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white capitalize">
                {{ currentPost.social_media }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
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
              @click="showDeleteModal = false"
            >
              {{ t('common.cancel') }}
            </UButton>
            <UButton 
              color="error" 
              :loading="isDeleting"
              @click="handleDelete"
            >
              {{ t('common.delete') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
