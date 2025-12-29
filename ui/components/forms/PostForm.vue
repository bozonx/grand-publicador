<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { PostWithRelations, PostCreateInput, PostUpdateInput } from '~/composables/usePosts'
import type { ChannelWithBlog } from '~/composables/useChannels'

type PostStatusEnum = Database['public']['Enums']['post_status_enum']
type PostTypeEnum = Database['public']['Enums']['post_type_enum']

interface Props {
  /** Blog ID for fetching channels */
  blogId: string
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
const { createPost, updatePost, isLoading, statusOptions, typeOptions } = usePosts()
const { channels, fetchChannels } = useChannels()

// Form state
const formData = reactive({
  channel_id: props.post?.channel_id || props.channelId || '',
  content: props.post?.content || '',
  post_type: (props.post?.post_type || 'post') as PostTypeEnum,
  title: props.post?.title || '',
  description: props.post?.description || '',
  author_comment: props.post?.author_comment || '',
  tags: props.post?.tags?.join(', ') || '',
  post_date: props.post?.post_date || '',
  status: (props.post?.status || 'draft') as PostStatusEnum,
  scheduled_at: props.post?.scheduled_at || '',
})

const isEditMode = computed(() => !!props.post?.id)
const showAdvancedFields = ref(false)

// Fetch channels on mount
onMounted(() => {
  if (props.blogId) {
    fetchChannels(props.blogId)
  }
})

// Channel options for select
const channelOptions = computed(() => {
  return channels.value.map((channel: ChannelWithBlog) => ({
    value: channel.id,
    label: `${channel.name} (${channel.social_media})`,
  }))
})

// Status options for select (only draft and scheduled for creation/editing)
const availableStatusOptions = computed(() => {
  return statusOptions.value.filter((opt) => ['draft', 'scheduled'].includes(opt.value))
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
      post_type: formData.post_type,
      title: formData.title || undefined,
      description: formData.description || undefined,
      author_comment: formData.author_comment || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      post_date: formData.post_date || undefined,
      status: formData.status,
      scheduled_at:
        formData.status === 'scheduled' ? formData.scheduled_at || undefined : undefined,
    }

    const result = await updatePost(props.post.id, updateData)
    if (result) {
      emit('success', result.id)
    }
  } else {
    // Create new post
    if (!formData.channel_id) {
      return // Validation should prevent this
    }

    const createData: PostCreateInput = {
      channel_id: formData.channel_id,
      content: formData.content,
      post_type: formData.post_type,
      title: formData.title || undefined,
      description: formData.description || undefined,
      author_comment: formData.author_comment || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      post_date: formData.post_date || undefined,
      status: formData.status,
      scheduled_at:
        formData.status === 'scheduled' ? formData.scheduled_at || undefined : undefined,
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
  if (!isEditMode.value && !formData.channel_id) return false
  if (!isContentValid.value) return false
  if (formData.status === 'scheduled' && !formData.scheduled_at) return false
  return true
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
    <!-- Header -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ isEditMode ? t('post.editPost') : t('post.createPost') }}
      </h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{
          isEditMode
            ? t('post.editDescription', 'Update your post content and settings')
            : t('post.createDescription', 'Create a new post for your channel')
        }}
      </p>
    </div>

    <div class="p-6 space-y-6">
      <!-- Channel selection (only for new posts) -->
      <div v-if="!isEditMode">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('channel.title') }} <span class="text-red-500">*</span>
        </label>
        <USelect
          v-model="formData.channel_id"
          :options="channelOptions"
          option-attribute="label"
          value-attribute="value"
          :placeholder="t('post.selectChannel', 'Select a channel')"
          class="w-full"
          size="lg"
        />
        <p
          v-if="channelOptions.length === 0"
          class="mt-2 text-sm text-amber-600 dark:text-amber-400"
        >
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-1" />
          {{ t('post.noChannelsAvailable', 'No channels available. Create a channel first.') }}
        </p>
      </div>

      <!-- Channel info (for edit mode) -->
      <div v-else-if="post?.channel" class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          {{ t('channel.title') }}
        </label>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-signal" class="w-5 h-5 text-gray-400" />
          <span class="font-medium text-gray-900 dark:text-white">
            {{ post.channel.name }}
          </span>
          <UBadge size="xs" color="neutral">
            {{ post.channel.social_media }}
          </UBadge>
        </div>
      </div>

      <!-- Post type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('post.postType') }} <span class="text-red-500">*</span>
        </label>
        <USelect
          v-model="formData.post_type"
          :options="typeOptions"
          option-attribute="label"
          value-attribute="value"
          class="w-full"
        />
      </div>

      <!-- Title (optional) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('post.postTitle') }}
          <span class="text-gray-400 font-normal">({{ t('common.optional') }})</span>
        </label>
        <UInput
          v-model="formData.title"
          :placeholder="t('post.titlePlaceholder', 'Enter post title')"
          size="lg"
        />
      </div>

      <!-- Content (required) - Tiptap Editor -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('post.content') }} <span class="text-red-500">*</span>
        </label>
        <EditorTiptapEditor
          v-model="formData.content"
          :placeholder="t('post.contentPlaceholder', 'Write your post content here...')"
          :min-height="250"
        />
        <p v-if="!isContentValid && formData.content" class="mt-2 text-sm text-red-500">
          {{ t('validation.required') }}
        </p>
      </div>

      <!-- Status and Scheduling -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('post.status') }}
          </label>
          <USelect
            v-model="formData.status"
            :options="availableStatusOptions"
            option-attribute="label"
            value-attribute="value"
            class="w-full"
          />
        </div>

        <div v-if="formData.status === 'scheduled'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('post.scheduledAt') }} <span class="text-red-500">*</span>
          </label>
          <UInput v-model="formData.scheduled_at" type="datetime-local" class="w-full" />
        </div>
      </div>

      <!-- Advanced fields toggle -->
      <div>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          :icon="showAdvancedFields ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
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
      <div
        v-if="showAdvancedFields"
        class="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('post.description') }}
          </label>
          <UTextarea
            v-model="formData.description"
            :placeholder="t('post.descriptionPlaceholder', 'Short description of your post')"
            :rows="3"
          />
        </div>

        <!-- Author comment -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('post.authorComment') }}
          </label>
          <UTextarea
            v-model="formData.author_comment"
            :placeholder="t('post.authorCommentPlaceholder', 'Internal comment (not published)')"
            :rows="2"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{
              t(
                'post.authorCommentHint',
                'This comment is for internal use only and will not be published.'
              )
            }}
          </p>
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('post.tags') }}
          </label>
          <UInput
            v-model="formData.tags"
            :placeholder="t('post.tagsPlaceholder', 'tag1, tag2, tag3')"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t('post.tagsHint', 'Separate tags with commas') }}
          </p>
        </div>

        <!-- Post date (content date) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('post.postDate') }}
          </label>
          <UInput v-model="formData.post_date" type="date" />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{
              t('post.postDateHint', 'The date associated with the content (not publication date)')
            }}
          </p>
        </div>
      </div>

      <!-- Form actions -->
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
          type="button"
          color="primary"
          :loading="isLoading"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          {{ isEditMode ? t('common.save') : t('common.create') }}
        </UButton>
      </div>
    </div>
  </div>
</template>
