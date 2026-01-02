<script setup lang="ts">
import type { ChannelWithProject } from '~/composables/useChannels'
import type { PublicationWithRelations } from '~/composables/usePublications'
import { usePosts } from '~/composables/usePosts'
import SocialIcon from '~/components/common/SocialIcon.vue'

interface Props {
  publication: PublicationWithRelations
  availableChannels: ChannelWithProject[]
}

interface Emits {
  (e: 'success', post: any): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const { createPost, isLoading } = usePosts()

const formData = reactive({
  channelId: '',
  content: props.publication.content || '',
  title: props.publication.title || '',
  tags: props.publication.tags || '',
  postType: props.publication.postType || 'POST',
  status: 'DRAFT',
  language: props.publication.language || 'en-US',
  socialMedia: '',
})

// Initialize channel if only one available
onMounted(() => {
  if (props.availableChannels.length === 1) {
    selectChannel(props.availableChannels[0].id)
  }
})

function selectChannel(channelId: string) {
  formData.channelId = channelId
  const channel = props.availableChannels.find(c => c.id === channelId)
  if (channel) {
    formData.language = channel.language
    formData.socialMedia = channel.socialMedia
  }
}

const channelOptions = computed(() => {
    return props.availableChannels.map(c => ({
        value: c.id,
        label: c.name,
        socialMedia: c.socialMedia,
        language: c.language
    }))
})

// Auto-select channel details when channelId changes
watch(() => formData.channelId, (newVal) => {
    if (newVal) selectChannel(newVal)
})

async function handleSave() {
    if (!formData.channelId) return

    const channel = props.availableChannels.find(c => c.id === formData.channelId)
    if (!channel) return

    const createData = {
        channelId: formData.channelId,
        publicationId: props.publication.id,
        content: formData.content,
        title: formData.title || undefined,
        tags: formData.tags || undefined,
        postType: formData.postType as any,
        status: formData.status as any,
        socialMedia: channel.socialMedia,
        language: formData.language,
        // Inherit other fields from publication if needed or allow edit
    }

    const newPost = await createPost(createData)
    if (newPost) {
        emit('success', newPost)
    }
}

function handleCancel() {
    emit('cancel')
}

// Validity
const isValid = computed(() => {
    return !!formData.channelId && !!formData.content
})

</script>

<template>
  <div class="border border-green-200 dark:border-green-800/50 rounded-lg bg-green-50/30 dark:bg-green-900/10 overflow-hidden mb-4 shadow-sm ring-1 ring-green-500/20">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800/50">
      <div class="flex items-center gap-2">
         <UIcon name="i-heroicons-plus-circle" class="w-5 h-5 text-green-600 dark:text-green-400" />
         <span class="font-medium text-green-900 dark:text-green-300">
             {{ t('post.createPost', 'Create Post') }}
         </span>
      </div>
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-heroicons-x-mark"
        size="sm"
        @click="handleCancel"
      />
    </div>

    <!-- Content -->
    <div class="p-6 space-y-6">
      
      <!-- Channel Selector -->
      <UFormField :label="t('post.selectChannel', 'Select Channel')" required>
         <USelectMenu
            v-model="formData.channelId"
            :items="channelOptions"
            value-key="value"
            label-key="label"
            class="w-full"
            :placeholder="t('post.selectChannel', 'Select a channel...')"
         >
            <template #option="{ option }">
                <div class="flex items-center gap-2 w-full">
                    <SocialIcon :platform="option.socialMedia" size="xs" />
                    <span class="truncate">{{ option.label }}</span>
                    <span class="ml-auto text-xs text-gray-500 uppercase">{{ option.language }}</span>
                </div>
            </template>
         </USelectMenu>
      </UFormField>

      <div v-if="formData.channelId">
        <!-- Title -->
        <UFormField :label="t('post.postTitle')" :help="t('common.optional')">
            <UInput
            v-model="formData.title"
            :placeholder="t('post.titlePlaceholder')"
            class="w-full"
            />
        </UFormField>

        <!-- Content -->
        <UFormField :label="t('post.content')" required>
            <EditorTiptapEditor
            v-model="formData.content"
            :placeholder="t('post.contentPlaceholder')"
            :min-height="200"
            />
        </UFormField>

        <!-- Tags -->
        <UFormField :label="t('post.tags')" :help="t('post.tagsHint')">
            <UInput
                v-model="formData.tags"
                :placeholder="t('post.tagsPlaceholder')"
                icon="i-heroicons-hashtag"
            />
        </UFormField>
      </div>

      <!-- Actions -->
      <div class="flex justify-end pt-2 gap-2">
        <UButton
            color="neutral"
            variant="ghost"
            @click="handleCancel"
        >
            {{ t('common.cancel') }}
        </UButton>
        <UButton
          color="primary"
          :loading="isLoading"
          :disabled="!isValid"
          @click="handleSave"
        >
          {{ t('common.create') }}
        </UButton>
      </div>

    </div>
  </div>
</template>
