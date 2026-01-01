<script setup lang="ts">
import type { PublicationWithRelations } from '~/composables/usePublications'
import type { ChannelWithProject } from '~/composables/useChannels'
import { usePublications } from '~/composables/usePublications'

interface Props {
  /** Project ID for fetching channels */
  projectId: string
  /** Publication data for editing, null for creating new */
  publication?: PublicationWithRelations | null
}

interface Emits {
  (e: 'success', publicationId: string): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  publication: null,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()
const { createPublication, updatePublication, createPostsFromPublication, isLoading, getStatusDisplayName } = usePublications()
const { channels, fetchChannels, isLoading: isChannelsLoading } = useChannels()
const router = useRouter()

// Form state
const formData = reactive({
  title: props.publication?.title || '',
  content: props.publication?.content || '',
  tags: props.publication?.tags || '',
  status: (props.publication?.status || 'DRAFT') as 'DRAFT' | 'SCHEDULED',
  scheduledAt: '',
  channelIds: [] as string[],
})

const isEditMode = computed(() => !!props.publication?.id)
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

// Status options
const statusOptions = [
  { value: 'DRAFT', label: t('postStatus.draft') },
  { value: 'SCHEDULED', label: t('postStatus.scheduled') },
]

/**
 * Handle form submission
 */
async function handleSubmit() {
  if (isEditMode.value && props.publication) {
    // Update existing publication
    const updateData: any = {
        title: formData.title || undefined,
        content: formData.content,
        tags: formData.tags || undefined,
        status: formData.status,
    }
    
    // Note: updating status to SCHEDULED ? Backend might not handle distribution automatically on update
    
    const result = await updatePublication(props.publication.id, updateData)
    if (result) {
      emit('success', result.id)
    }
  } else {
    // Create new publication
    const createData: any = {
      projectId: props.projectId,
      title: formData.title || undefined,
      content: formData.content,
      tags: formData.tags || undefined,
      status: formData.status === 'SCHEDULED' && formData.channelIds.length > 0 ? 'SCHEDULED' : 'DRAFT', // Master status
    }

    const publication = await createPublication(createData)
    
    if (publication) {
      // If channels are selected, distribute posts
      if (formData.channelIds.length > 0) {
        await createPostsFromPublication(
            publication.id, 
            formData.channelIds, 
            formData.status === 'SCHEDULED' ? formData.scheduledAt : undefined
        )
      }
      
      emit('success', publication.id)
    }
  }
}

function handleCancel() {
  emit('cancel')
}

function toggleAdvancedFields() {
  showAdvancedFields.value = !showAdvancedFields.value
}

const isContentValid = computed(() => {
  const textContent = formData.content.replace(/<[^>]*>/g, '').trim()
  return textContent.length > 0
})

const isFormValid = computed(() => {
  if (!isContentValid.value) return false
  if (formData.status === 'SCHEDULED' && !formData.scheduledAt) return false
  return true
})

function toggleChannel(channelId: string) {
    const index = formData.channelIds.indexOf(channelId)
    if (index === -1) {
        formData.channelIds.push(channelId)
    } else {
        formData.channelIds.splice(index, 1)
    }
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ isEditMode ? t('publication.edit', 'Edit Publication') : t('publication.create', 'Create Publication') }}
      </h2>
      <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
        {{
          isEditMode
            ? t('publication.editDescription', 'Update your publication content')
            : t('publication.createDescription', 'Create content to distribute across channels')
        }}
      </p>
    </div>

    <form class="p-6 space-y-6" @submit.prevent="handleSubmit">
      
      <!-- Channels (Multi-select) - Only for new publications for now -->
      <!-- Channels (Multi-select) -->
      <div v-if="!isEditMode">
        <UFormField :label="t('channel.titlePlural', 'Channels')" :help="t('publication.channelsHelp', 'Select channels to create posts immediately')">
            <div v-if="channelOptions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div 
                    v-for="channel in channelOptions" 
                    :key="channel.value" 
                    class="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    @click="toggleChannel(channel.value)"
                >
                    <UCheckbox 
                        :model-value="formData.channelIds.includes(channel.value)"
                        @update:model-value="toggleChannel(channel.value)"
                        :label="channel.label"
                        class="pointer-events-none" 
                    />
                </div>
            </div>
            <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
                {{ t('publication.noChannels', 'No channels available. Create a channel first to publish.') }}
            </div>
        </UFormField>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
         <!-- Status -->
         <UFormField :label="t('post.status')" required>
            <USelectMenu
                v-model="formData.status"
                :items="statusOptions"
                value-key="value"
                label-key="label"
                class="w-full"
            />
         </UFormField>

         <!-- Scheduling -->
        <UFormField v-if="formData.status === 'SCHEDULED'" :label="t('post.scheduledAt')" required>
            <UInput v-model="formData.scheduledAt" type="datetime-local" class="w-full" icon="i-heroicons-clock" />
        </UFormField>
      </div>

      <!-- Title (optional) -->
      <UFormField :label="t('post.postTitle')" :help="t('common.optional')">
        <UInput
          v-model="formData.title"
          :placeholder="t('post.titlePlaceholder', 'Enter title')"
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
          :placeholder="t('post.contentPlaceholder', 'Write your content here...')"
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
          <UFormField :label="t('post.tags')" :help="t('post.tagsHint')">
            <UInput
                v-model="formData.tags"
                :placeholder="t('post.tagsPlaceholder', 'tag1, tag2, tag3')"
                icon="i-heroicons-hashtag"
                @keydown.enter.prevent
            />
          </UFormField>
        </div>
      </Transition>

      <div class="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
  </div>
</template>
