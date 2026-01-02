<script setup lang="ts">
import type { PublicationWithRelations } from '~/composables/usePublications'
import type { ChannelWithProject } from '~/composables/useChannels'
import { usePublications } from '~/composables/usePublications'
import { usePosts } from '~/composables/usePosts'
import SocialIcon from '~/components/common/SocialIcon.vue'

import type { PostStatus, PostType } from '~/types/posts'

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
const route = useRoute()
const { createPublication, updatePublication, createPostsFromPublication, isLoading, getStatusDisplayName, fetchPublicationsByProject, publications } = usePublications()
const { 
  channels, 
  fetchChannels, 
  isLoading: isChannelsLoading
} = useChannels()
const { typeOptions, statusOptions: allStatusOptions } = usePosts()
const router = useRouter()

// Get language and channelId from URL query parameters
const languageParam = computed(() => route.query.language as string | undefined)
const channelIdParam = computed(() => route.query.channelId as string | undefined)

// Form state
const formData = reactive({
  title: props.publication?.title || '',
  content: props.publication?.content || '',
  tags: props.publication?.tags || '',
  postType: (props.publication?.postType || 'POST') as PostType,
  status: (props.publication?.status || 'DRAFT') as PostStatus,
  scheduledAt: '',
  language: props.publication?.language || languageParam.value || 'en-US',
  channelIds: props.publication?.posts?.map((p: any) => p.channelId) || [] as string[],
  translationGroupId: props.publication?.translationGroupId || undefined as string | undefined,
  meta: props.publication?.meta ? JSON.parse(props.publication.meta) : {},
})

const linkedPublicationId = ref<string | undefined>(undefined)

const isEditMode = computed(() => !!props.publication?.id)
const showAdvancedFields = ref(false)

// Fetch channels and publications on mount
onMounted(async () => {
  if (props.projectId) {
    await fetchChannels(props.projectId)
    // Fetch recent publications to allow linking (limit 50 for now)
    await fetchPublicationsByProject(props.projectId, { limit: 50 })
    
    // Auto-select channel if channelId parameter is provided
    if (channelIdParam.value && !isEditMode.value) {
      const selectedChannel = channels.value.find(ch => ch.id === channelIdParam.value)
      if (selectedChannel) {
        formData.channelIds = [channelIdParam.value]
        formData.language = selectedChannel.language
      }
    }
    // Otherwise, auto-select channels matching the language parameter
    else if (languageParam.value && !isEditMode.value) {
      const matchingChannels = channels.value
        .filter(ch => ch.language === languageParam.value)
        .map(ch => ch.id)
      formData.channelIds = matchingChannels
    }
  }
})

// Publications available for linking (exclude current)
const availablePublications = computed(() => {
    return publications.value
        .filter(p => p.id !== props.publication?.id)
        .map(p => ({
            value: p.id,
            label: p.title ? `${p.title} (${p.language})` : `Untitled (${p.language}) - ${new Date(p.createdAt).toLocaleDateString()}`,
            translationGroupId: p.translationGroupId,
            language: p.language
        }))
})

// Handle translation group selection
function handleTranslationLink(publicationId: string) {
    linkedPublicationId.value = publicationId
    formData.translationGroupId = undefined
}

// Channel options for select
const channelOptions = computed(() => {
  return channels.value.map((channel: ChannelWithProject) => ({
    value: channel.id,
    label: channel.name,
    socialMedia: channel.socialMedia,
    language: channel.language,
  }))
})

// Status options
const statusOptions = computed(() => {
  return allStatusOptions.value.filter((opt) => ['DRAFT', 'SCHEDULED'].includes(opt.value as string))
})

const { languageOptions } = useLanguages()

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
        language: formData.language,
        linkToPublicationId: linkedPublicationId.value || undefined, // Send linkToPublicationId
        postType: formData.postType,
        meta: formData.meta,
    }
    
    // Update the publication itself
    await updatePublication(props.publication.id, updateData)
    
    // Handle post creation for newly selected channels
    const originalChannelIds = props.publication.posts?.map((p: any) => p.channelId) || []
    const newChannelIds = formData.channelIds.filter(id => !originalChannelIds.includes(id))
    
    if (newChannelIds.length > 0) {
        await createPostsFromPublication(
            props.publication.id, 
            newChannelIds, 
            formData.status === 'SCHEDULED' ? formData.scheduledAt : undefined
        )
    }

    emit('success', props.publication.id)

  } else {
    // Create new publication
    const createData: any = {
      projectId: props.projectId,
      title: formData.title || undefined,
      content: formData.content,
      tags: formData.tags || undefined,
      status: formData.status === 'SCHEDULED' && formData.channelIds.length > 0 ? 'SCHEDULED' : 'DRAFT', // Master status
      language: formData.language,
      linkToPublicationId: linkedPublicationId.value || undefined,
      postType: formData.postType,
      meta: formData.meta,
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
  <div class="app-card">
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
      
      <!-- Channels (Multi-select) -->
      <div v-if="!isEditMode">
        <UFormField :label="t('channel.titlePlural', 'Channels')" :help="t('publication.channelsHelp', 'Select channels to create posts immediately')">
            <div v-if="channelOptions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div 
                    v-for="channel in channelOptions" 
                    :key="channel.value" 
                    class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    @click="toggleChannel(channel.value)"
                >
                    <div class="flex items-center gap-2">
                        <UCheckbox 
                            :model-value="formData.channelIds.includes(channel.value)"
                            @update:model-value="toggleChannel(channel.value)"
                            class="pointer-events-none" 
                        />
                        <span class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                            {{ channel.label }}
                        </span>
                    </div>
                    
                    <div class="flex items-center gap-1.5 shrink-0 ml-2">
                        <span class="text-xxs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded flex items-center gap-1 font-mono uppercase">
                            <UIcon name="i-heroicons-language" class="w-3 h-3" />
                            {{ channel.language }}
                        </span>
                        <UTooltip v-if="channel.language !== formData.language" :text="t('publication.languageMismatch', 'Language mismatch! Publication is ' + formData.language)">
                            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-amber-500" />
                        </UTooltip>
                        <UTooltip :text="channel.socialMedia">
                            <SocialIcon :platform="channel.socialMedia" size="sm" />
                        </UTooltip>
                    </div>
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

        <!-- Language -->
        <UFormField :label="t('common.language', 'Language')" required>
            <USelectMenu
                v-model="formData.language"
                :items="languageOptions"
                value-key="value"
                label-key="label"
                class="w-full"
            >
                <template #leading>
                    <UIcon name="i-heroicons-language" class="w-4 h-4" />
                </template>
            </USelectMenu>
        </UFormField>

         <UFormField :label="t('post.postType', 'Post Type')" required>
            <USelectMenu
                v-model="formData.postType"
                :items="typeOptions"
                value-key="value"
                label-key="label"
                class="w-full"
            />
         </UFormField>

         <!-- Translation Group (Link to another publication) -->
         <UFormField :label="t('publication.linkTranslation', 'Link as Translation of')" :help="t('publication.linkTranslationHelp', 'Select a publication to link this one as a translation version.')">
            <USelectMenu
                :model-value="linkedPublicationId"
                :items="availablePublications"
                value-key="value"
                label-key="label"
                searchable
                :placeholder="formData.translationGroupId ? t('publication.linked', 'Linked to a group') : t('publication.selectToLink', 'Select to link...')"
                class="w-full"
                @update:model-value="handleTranslationLink"
            >

            </USelectMenu>
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
