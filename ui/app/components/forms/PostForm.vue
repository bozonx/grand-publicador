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
const { createPost, updatePost, isLoading, statusOptions, typeOptions } = usePosts()
const { channels, fetchChannels } = useChannels()

// Form state
const formData = reactive({
  channelId: props.post?.channelId || props.channelId || '',
  content: props.post?.content || '',
  postType: (props.post?.postType || 'post') as PostTypeEnum,
  title: props.post?.title || '',
  description: props.post?.description || '',
  authorComment: props.post?.authorComment || '',
  tags: props.post?.tags || '',
  postDate: props.post?.postDate || '',
  status: (props.post?.status || 'draft') as PostStatusEnum,
  scheduledAt: props.post?.scheduledAt || '',
})

const isEditMode = computed(() => !!props.post?.id)
const showAdvancedFields = ref(false)

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
      postType: formData.postType,
      title: formData.title || undefined,
      description: formData.description || undefined,
      authorComment: formData.authorComment || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      postDate: formData.postDate || undefined,
      status: formData.status,
      scheduledAt:
        formData.status === 'scheduled' ? formData.scheduledAt || undefined : undefined,
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
        formData.status === 'scheduled' ? formData.scheduledAt || undefined : undefined,
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
  if (!isEditMode.value && !formData.channelId) return false
  if (!isContentValid.value) return false
  if (formData.status === 'scheduled' && !formData.scheduledAt) return false
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

      <!-- Scheduling -->
      <UFormField v-if="formData.status === 'scheduled'" :label="t('post.scheduledAt')" required>
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
          type="submit"
          color="primary"
          :loading="isLoading"
          :disabled="!isFormValid"
        >
          <template #default>
            {{ isEditMode ? t('common.save') : t('common.create') }}
          </template>
        </UButton>
      </div>
    </form>
  </div>
</template>
