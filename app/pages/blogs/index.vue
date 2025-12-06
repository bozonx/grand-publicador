<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const router = useRouter()
const { blogs, isLoading, error, fetchBlogs, deleteBlog, canEdit, canDelete, getRoleDisplayName } =
  useBlogs()

// Delete confirmation modal state
const showDeleteModal = ref(false)
const blogToDelete = ref<string | null>(null)
const isDeleting = ref(false)

// Fetch blogs on mount
onMounted(() => {
  fetchBlogs()
})

/**
 * Navigate to create blog page
 */
function goToCreateBlog() {
  router.push('/blogs/new')
}

/**
 * Navigate to blog details page
 */
function goToBlog(blogId: string) {
  router.push(`/blogs/${blogId}`)
}

/**
 * Navigate to edit blog page
 */
function goToEditBlog(blogId: string) {
  router.push(`/blogs/${blogId}?edit=true`)
}

/**
 * Open delete confirmation modal
 */
function confirmDelete(blogId: string) {
  blogToDelete.value = blogId
  showDeleteModal.value = true
}

/**
 * Handle blog deletion
 */
async function handleDelete() {
  if (!blogToDelete.value) return

  isDeleting.value = true
  const success = await deleteBlog(blogToDelete.value)
  isDeleting.value = false

  if (success) {
    showDeleteModal.value = false
    blogToDelete.value = null
  }
}

/**
 * Cancel delete action
 */
function cancelDelete() {
  showDeleteModal.value = false
  blogToDelete.value = null
}

/**
 * Format date for display
 */
function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

/**
 * Get role badge color based on role
 */
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
function getRoleBadgeColor(role: string | undefined): BadgeColor {
  const colors: Record<string, BadgeColor> = {
    owner: 'primary',
    admin: 'secondary',
    editor: 'info',
    viewer: 'neutral',
  }
  return colors[role || 'viewer'] || 'neutral'
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('blog.titlePlural') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('blog.myBlogs') }}
        </p>
      </div>
      <UButton icon="i-heroicons-plus" @click="goToCreateBlog">
        {{ t('blog.createBlog') }}
      </UButton>
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
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3"
        />
        <p class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Blogs list -->
    <div v-else-if="blogs.length > 0" class="space-y-4">
      <div
        v-for="blog in blogs"
        :key="blog.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        @click="goToBlog(blog.id)"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {{ blog.name }}
                </h3>
                <UBadge :color="getRoleBadgeColor(blog.role)" variant="subtle" size="sm">
                  {{ getRoleDisplayName(blog.role) }}
                </UBadge>
              </div>

              <p
                v-if="blog.description"
                class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3"
              >
                {{ blog.description }}
              </p>

              <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span v-if="blog.owner" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-user" class="w-4 h-4" />
                  {{ blog.owner.full_name || blog.owner.username || 'Unknown' }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                  {{ formatDate(blog.created_at) }}
                </span>
              </div>
            </div>

            <!-- Actions dropdown -->
            <div class="ml-4" @click.stop>
              <UDropdown
                :items="[
                  [
                    {
                      label: t('common.edit'),
                      icon: 'i-heroicons-pencil-square',
                      disabled: !canEdit(blog),
                      click: () => goToEditBlog(blog.id),
                    },
                  ],
                  [
                    {
                      label: t('common.delete'),
                      icon: 'i-heroicons-trash',
                      disabled: !canDelete(blog),
                      color: 'error' as const,
                      click: () => confirmDelete(blog.id),
                    },
                  ],
                ]"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-ellipsis-vertical"
                  :aria-label="t('common.actions')"
                />
              </UDropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
      <UIcon
        name="i-heroicons-book-open"
        class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('blog.noBlogsFound') }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        Create your first blog to start managing your social media content.
      </p>
      <UButton icon="i-heroicons-plus" @click="goToCreateBlog">
        {{ t('blog.createBlog') }}
      </UButton>
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
              {{ t('blog.deleteBlog') }}
            </h3>
          </div>

          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t('blog.deleteConfirm') }}
          </p>

          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="isDeleting" @click="cancelDelete">
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
