<script setup lang="ts">
import type { ProjectWithRole } from '~/stores/projects'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { canGoBack, goBack: navigateBack } = useNavigation()

const projectId = computed(() => route.params.id as string)
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
  canDelete,
  toggleArchive,
} = usePosts()

// UI state
const isEditMode = computed(() => route.query.edit === 'true')

// Tags handling
const tagsArray = computed(() => {
  if (!currentPost.value?.tags) return []
  if (Array.isArray(currentPost.value.tags)) return currentPost.value.tags
  return currentPost.value.tags.split(',').map(tag => tag.trim()).filter(Boolean)
})

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
  navigateBack()
}

/**
 * Toggle edit mode
 */
function toggleEditMode() {
  router.replace({
    query: { ...route.query, edit: isEditMode.value ? undefined : 'true' },
  })
}

/**
 * Handle successful update
 */
function handleSuccess() {
  router.replace({
    query: { ...route.query, edit: undefined },
  })
  fetchPost(postId.value)
}

/**
 * Handle cancel edit
 */
function handleCancel() {
  router.replace({
    query: { ...route.query, edit: undefined },
  })
}

/**
 * Toggle archive status
 */
async function handleArchive() {
  await toggleArchive(postId.value)
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
        :disabled="!canGoBack"
        @click="goBack"
      >
        {{ t('common.back') }}
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
      <div class="mt-4">
        <UButton variant="outline" color="neutral" @click="goBack">
          {{ t('common.back') }}
        </UButton>
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

    <!-- Post not found -->
    <div
      v-else-if="!currentPost"
      class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center"
    >
      <UIcon
        name="i-heroicons-document-magnifying-glass"
        class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('errors.notFound') }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{
          t(
            'post.notFoundDescription',
            "The post you're looking for doesn't exist or you don't have access to it."
          )
        }}
      </p>
      <UButton @click="goBack">
        {{ t('common.back') }}
      </UButton>
    </div>

    <!-- Edit mode -->
    <div v-else-if="isEditMode && canEdit(currentPost)" class="max-w-4xl mx-auto">
      <FormsPostForm
        :project-id="projectId"
        :post="currentPost"
        @success="handleSuccess"
        @cancel="handleCancel"
      />
    </div>

    <!-- View mode -->
    <div v-else class="space-y-6">
      
      <!-- Top Banner: Post Info -->
      <UCard>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-6 text-sm">
             <!-- Author -->
            <div v-if="currentPost.author" class="flex items-center gap-2">
              <UAvatar
                 :alt="(currentPost.author.fullName || currentPost.author.username) || ''"
                 size="xs"
              />
              <span class="font-medium text-gray-900 dark:text-white">
                {{ currentPost.author.fullName || currentPost.author.username }}
              </span>
            </div>

            <!-- Post Type -->
            <div class="flex items-center gap-2">
              <span class="text-gray-500 dark:text-gray-400">{{ t('post.type') }}:</span>
              <UBadge color="neutral" variant="subtle">
                {{ getTypeDisplayName(currentPost.postType) }}
              </UBadge>
            </div>

            <!-- Status -->
            <div class="flex items-center gap-2">
              <span class="text-gray-500 dark:text-gray-400">{{ t('post.status') }}:</span>
              <UBadge :color="getStatusColor(currentPost.status)" variant="subtle">
                {{ getStatusDisplayName(currentPost.status) }}
              </UBadge>
            </div>

            <!-- Published At -->
            <div v-if="currentPost.publishedAt" class="flex items-center gap-2">
              <span class="text-gray-500 dark:text-gray-400">{{ t('post.publishedAt') }}:</span>
              <span class="text-gray-900 dark:text-white font-medium">
                {{ formatDateTime(currentPost.publishedAt) }}
              </span>
            </div>
          </div>

          <!-- Actions (Edit/Archive) -->
          <div class="flex items-center gap-2">
            <UButton
              v-if="canEdit(currentPost)"
              color="primary"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              size="sm"
              @click="toggleEditMode"
            >
              {{ t('common.edit') }}
            </UButton>
            <UButton
              v-if="canEdit(currentPost)"
              :color="currentPost.archivedAt ? 'success' : 'neutral'"
              variant="ghost"
              :icon="currentPost.archivedAt ? 'i-heroicons-archive-box-arrow-down' : 'i-heroicons-archive-box'"
              size="sm"
              :loading="isLoading"
              @click="handleArchive"
            >
              {{ currentPost.archivedAt ? t('common.restore') : t('common.archive') }}
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Content Block -->
      <UCard>
        <div class="space-y-6">
          <!-- Title -->
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ currentPost.title || t('post.untitled', 'Untitled') }}
            </h1>
          </div>

          <!-- Description -->
          <div v-if="currentPost.description" class="text-gray-600 dark:text-gray-300">
            {{ currentPost.description }}
          </div>

          <!-- Content -->
           <div class="prose prose-sm dark:prose-invert max-w-none border-t border-b border-gray-100 dark:border-gray-800 py-6" v-html="currentPost.content" />

           <!-- Tags -->
           <div v-if="tagsArray.length > 0" class="flex flex-wrap gap-2">
              <UBadge
                v-for="tag in tagsArray"
                :key="tag"
                color="neutral"
                variant="soft"
                size="sm"
              >
                #{{ tag }}
              </UBadge>
           </div>

           <!-- Dates Grid -->
           <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div v-if="currentPost.postDate" class="space-y-1">
                <span class="text-xs font-medium text-gray-500 uppercase">{{ t('post.postDate') }}</span>
                <div class="flex items-center gap-2 text-gray-900 dark:text-white">
                   <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-gray-400" />
                   {{ formatDate(currentPost.postDate) }}
                </div>
              </div>
              
              <div v-if="currentPost.scheduledAt" class="space-y-1">
                <span class="text-xs font-medium text-gray-500 uppercase">{{ t('post.scheduledAt') }}</span>
                 <div class="flex items-center gap-2 text-gray-900 dark:text-white">
                   <UIcon name="i-heroicons-clock" class="w-4 h-4 text-gray-400" />
                   {{ formatDateTime(currentPost.scheduledAt) }}
                </div>
              </div>
           </div>

           <!-- Meta Textarea -->
           <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t('common.meta') }}</label>
              <UTextarea
                :model-value="currentPost.meta"
                readonly
                :rows="3"
                variant="outline"
                class="font-mono text-sm"
              />
           </div>
        </div>
      </UCard>

      <!-- Bottom Block: Publication Info -->
      <UCard v-if="currentPost.publication">
        <template #header>
           <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                {{ t('publication.title') }}
              </h3>
              <UBadge color="neutral" variant="soft" size="xs">
                 {{ currentPost.publication.status }}
              </UBadge>
           </div>
        </template>
        
        <div class="space-y-4">
           <div>
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                 {{ currentPost.publication.title || t('common.untitled') }}
              </h4>
           </div>
           
           <div class="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
              {{ currentPost.publication.content }}
           </div>

           <div class="pt-2">
             <UButton
                :to="`/projects/${projectId}/publications/`" 
                variant="link"
                color="primary"
                class="p-0"
              >
                {{ t('publication.viewAll') }}
              </UButton>
              <!-- Ideally link to specific publication if such page exists -->
           </div>
        </div>
      </UCard>

    </div>
  </div>
</template>
