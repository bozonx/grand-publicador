<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { PostWithRelations, PostCreateInput, PostUpdateInput } from '~/composables/usePosts'
import type { ChannelWithProject } from '~/composables/useChannels'

type PostStatusEnum = Database['public']['Enums']['post_status_enum']
type PostTypeEnum = Database['public']['Enums']['post_type_enum']

interface Props {
  /** Project ID for fetching channels */
  projectId: string
  /** Post data for editing, null for creating new */
  post?: PostWithRelations | null
  /** Pre-selected channel ID */
  channelId?: string
}

interface Emits {
  (e: 'success', postId: string): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  post: null,
  channelId: undefined,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()
const { createPost, updatePost, deletePost, isLoading, statusOptions, typeOptions } = usePosts()
const { channels, fetchChannels, isLoading: isChannelsLoading } = useChannels()
const router = useRouter()

const showDeleteModal = ref(false)
const isDeleting = ref(false)

// Form state
const formData = reactive({
  channelId: props.post?.channelId || props.channelId || '',
  content: props.post?.content || '',
  postType: (props.post?.postType || 'POST') as PostType,
  title: props.post?.title || '',
  description: props.post?.description || '',
  authorComment: props.post?.authorComment || '',
  tags: props.post?.tags || '',
  postDate: props.post?.postDate || '',
  status: (props.post?.status || 'DRAFT') as PostStatus,
  scheduledAt: props.post?.scheduledAt || '',
  language: props.post?.language || '',
})

const isEditMode = computed(() => !!props.post?.id)
const showAdvancedFields = ref(false)

// Watch for channelId prop changes (for when page is reused)
watch(
  () => props.channelId,
  (newChannelId) => {
    if (newChannelId && !isEditMode.value) {
      formData.channelId = newChannelId
    }
  }
)

// Fetch channels on mount
onMounted(() => {
  if (props.projectId) {
    fetchChannels(props.projectId)
  }
})

// Channel options for select
const channelOptions = computed(() => {
  return channels.value.map((channel: ChannelWithProject) => ({
    value: channel.id,
    label: `${channel.name} (${channel.socialMedia})`,
  }))
})

// Status options for select (only draft and scheduled for creation/editing)
const availableStatusOptions = computed(() => {
  return statusOptions.value.filter((opt) => ['DRAFT', 'SCHEDULED'].includes(opt.value as string))
})

const { languageOptions } = useLanguages()

// Watch for channel selection to set default language
watch(() => formData.channelId, (newChannelId) => {
  if (!isEditMode.value && newChannelId) {
    const selectedChannel = channels.value.find(c => c.id === newChannelId)
    if (selectedChannel && !formData.language) {
      formData.language = selectedChannel.language
    }
  }
})

/**
 * Handle form submission
 */
async function handleSubmit() {
  // Parse tags from comma-separated string
  const tagsArray = formData.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)

  if (isEditMode.value && props.post) {
    // Update existing post
    const updateData: PostUpdateInput = {
      content: formData.content,
      postType: formData.postType,
      title: formData.title || undefined,
      description: formData.description || undefined,
      authorComment: formData.authorComment || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      postDate: formData.postDate || undefined,
      status: formData.status,
      scheduledAt:
        formData.status === 'SCHEDULED' ? formData.scheduledAt || undefined : undefined,
    }

    const result = await updatePost(props.post.id, updateData)
    if (result) {
      emit('success', result.id)
    }
  } else {
    // Create new post
    if (!formData.channelId) {
      return // Validation should prevent this
    }

    const createData: PostCreateInput = {
      channelId: formData.channelId,
      content: formData.content,
      postType: formData.postType,
      title: formData.title || undefined,
      description: formData.description || undefined,
      authorComment: formData.authorComment || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      postDate: formData.postDate || undefined,
      status: formData.status,
      scheduledAt:
        formData.status === 'SCHEDULED' ? formData.scheduledAt || undefined : undefined,
      language: formData.language || undefined,
    }

    const result = await createPost(createData)
    if (result) {
      emit('success', result.id)
    }
  }
}

function handleCancel() {
  emit('cancel')
}

/**
 * Handle delete
 */
async function handleDelete() {
  if (!props.post?.id) return
  isDeleting.value = true
  const success = await deletePost(props.post.id)
  isDeleting.value = false

  if (success) {
    showDeleteModal.value = false
    // Emit cancel to close edit mode, then router will handle the redirect if needed
    // Actually, deletePost already shows a toast.
    router.push(`/projects/${props.projectId}/posts`)
  }
}

/**
 * Toggle advanced fields visibility
 */
function toggleAdvancedFields() {
  showAdvancedFields.value = !showAdvancedFields.value
}

/**
 * Check if content is valid (not empty)
 */
const isContentValid = computed(() => {
  // Strip HTML tags and check if there's actual content
  const textContent = formData.content.replace(/<[^>]*>/g, '').trim()
  return textContent.length > 0
})

/**
 * Check if form is valid
 */
const isFormValid = computed(() => {
  if (!isEditMode.value && !formData.channelId) return false
  if (!isContentValid.value) return false
  if (formData.status === 'SCHEDULED' && !formData.scheduledAt) return false
  if (!formData.language) return false
  return true
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ isEditMode ? t('post.editPost') : t('post.createPost') }}
      </h2>
      <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
        {{
          isEditMode
            ? t('post.editDescription', 'Update your post content and settings')
            : t('post.createDescription', 'Create a new post for your channel')
        }}
      </p>
    </div>

    <form class="p-6 space-y-6" @submit.prevent="handleSubmit">
      <!-- Channel selection (only for new posts) -->
      <div v-if="!isEditMode">
        <UFormField :label="t('channel.title')" required>
          <USelectMenu
            v-model="formData.channelId"
            :items="channelOptions"
            value-key="value"
            label-key="label"
            :placeholder="t('post.selectChannel', 'Select a channel')"
            class="w-full"
            size="lg"
            searchable
            :disabled="!!props.channelId"
            :loading="isChannelsLoading"
          />
          <template v-if="channelOptions.length === 0" #help>
            <div class="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
              <span>{{ t('post.noChannelsAvailable', 'No channels available. Create a channel first.') }}</span>
            </div>
          </template>
        </UFormField>
      </div>

      <!-- Channel info (for edit mode) -->
      <div v-else-if="post?.channel" class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {{ t('channel.title') }}
        </label>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5 text-primary-500" />
          <span class="font-medium text-gray-900 dark:text-white">
            {{ post.channel.name }}
          </span>
          <UBadge size="xs" color="neutral" variant="soft">
            {{ post.channel.socialMedia }}
          </UBadge>
        </div>
      </div>

      <!-- Post type & Status Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UFormField :label="t('post.postType')" required>
          <USelectMenu
            v-model="formData.postType"
            :items="typeOptions"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="t('post.status')" required>
          <USelectMenu
            v-model="formData.status"
            :items="availableStatusOptions"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
      </div>

      <!-- Language selection -->
      <UFormField :label="t('common.language')" required>
        <USelectMenu
          v-model="formData.language"
          :items="languageOptions"
          value-key="value"
          label-key="label"
          :placeholder="t('post.selectLanguage', 'Select language')"
          class="w-full"
          :disabled="isEditMode"
        >
          <template #leading>
            <UIcon name="i-heroicons-language" class="w-4 h-4" />
          </template>
        </USelectMenu>
        <template v-if="isEditMode" #help>
          <span class="text-xs text-gray-400">{{ t('post.languageCannotBeChanged', 'Language cannot be changed after post creation') }}</span>
        </template>
      </UFormField>

      <!-- Scheduling -->
      <UFormField v-if="formData.status === 'SCHEDULED'" :label="t('post.scheduledAt')" required>
        <UInput v-model="formData.scheduledAt" type="datetime-local" class="w-full" icon="i-heroicons-clock" />
      </UFormField>

      <!-- Title (optional) -->
      <UFormField :label="t('post.postTitle')" :help="t('common.optional')">
        <UInput
          v-model="formData.title"
          :placeholder="t('post.titlePlaceholder', 'Enter post title')"
          size="lg"
          class="w-full"
          type="text"
          @keydown.enter.prevent
        />
      </UFormField>

      <!-- Content (required) - Tiptap Editor -->
      <UFormField :label="t('post.content')" required>
        <EditorTiptapEditor
          v-model="formData.content"
          :placeholder="t('post.contentPlaceholder', 'Write your post content here...')"
          :min-height="250"
        />
        <template v-if="!isContentValid && formData.content" #error>
          {{ t('validation.required') }}
        </template>
      </UFormField>

      <!-- Advanced fields toggle -->
      <div class="flex justify-center">
        <UButton
          variant="outline"
          color="neutral"
          size="sm"
          :icon="showAdvancedFields ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="rounded-full"
          @click="toggleAdvancedFields"
        >
          {{
            showAdvancedFields
              ? t('post.hideAdvanced', 'Hide advanced options')
              : t('post.showAdvanced', 'Show advanced options')
          }}
        </UButton>
      </div>

      <!-- Advanced fields -->
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="showAdvancedFields"
          class="space-y-6 pt-6 mt-2 border-t border-gray-100 dark:border-gray-700"
        >
          <UFormField :label="t('post.description')">
            <UTextarea
              v-model="formData.description"
              :placeholder="t('post.descriptionPlaceholder', 'Short description of your post')"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('post.authorComment')" :help="t('post.authorCommentHint')">
            <UTextarea
              v-model="formData.authorComment"
              :placeholder="t('post.authorCommentPlaceholder', 'Internal comment (not published)')"
              :rows="2"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField :label="t('post.tags')" :help="t('post.tagsHint')">
              <UInput
                v-model="formData.tags"
                :placeholder="t('post.tagsPlaceholder', 'tag1, tag2, tag3')"
                icon="i-heroicons-hashtag"
                @keydown.enter.prevent
              />
            </UFormField>

            <UFormField :label="t('post.postDate')" :help="t('post.postDateHint')">
              <UInput v-model="formData.postDate" type="date" icon="i-heroicons-calendar-days" />
            </UFormField>
          </div>
        </div>
      </Transition>

      <div
        class="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <UButton
          type="button"
          color="neutral"
          variant="ghost"
          :disabled="isLoading"
          @click="handleCancel"
        >
          {{ t('common.cancel') }}
        </UButton>
        <UButton
          type="submit"
          color="primary"
          :loading="isLoading"
          :disabled="!isFormValid"
        >
          {{ isEditMode ? t('common.save') : t('common.create') }}
        </UButton>
      </div>
    </form>

    <!-- Danger Zone (only in edit mode) -->
    <div
      v-if="isEditMode"
      class="p-6 bg-red-50/50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/30 rounded-b-lg"
    >
      <div class="flex items-center justify-between gap-4">
        <div>
          <h3 class="text-sm font-semibold text-red-700 dark:text-red-400">
            {{ t('project.deletePost', 'Delete Post') }}
          </h3>
          <p class="text-xs text-red-600/70 dark:text-red-400/60 mt-0.5">
            {{ t('post.deleteConfirm', 'Are you sure you want to delete this post? This action cannot be undone.') }}
          </p>
        </div>
        <UButton
          color="error"
          variant="soft"
          icon="i-heroicons-trash"
          @click="showDeleteModal = true"
        >
          {{ t('common.delete') }}
        </UButton>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 text-center">
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {{ t('post.deletePost') }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ t('post.deleteConfirm') }}
          </p>
          <div class="flex items-center justify-center gap-3">
            <UButton
              color="neutral"
              variant="outline"
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
