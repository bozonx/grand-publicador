<script setup lang="ts">
import type { PostWithRelations } from '~/composables/usePosts'
import { usePosts } from '~/composables/usePosts'
import SocialIcon from '~/components/common/SocialIcon.vue'

interface Props {
  post: PostWithRelations
}

const props = defineProps<Props>()

const { t } = useI18n()
const { updatePost, isLoading } = usePosts()

const isCollapsed = ref(true)

const formData = reactive({
  content: props.post.content || '',
  title: props.post.title || '',
  tags: props.post.tags || '',
  // Add other fields as necessary, e.g. status, scheduledAt
})

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

async function handleSave() {
  await updatePost(props.post.id, {
    content: formData.content,
    title: formData.title || undefined,
    tags: formData.tags || undefined,
  })
}

// Reset form when post prop changes
watch(() => props.post, (newPost) => {
  formData.content = newPost.content || ''
  formData.title = newPost.title || ''
  formData.tags = newPost.tags || ''
})
</script>

<template>
  <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800/50 overflow-hidden mb-4 shadow-sm">
    <!-- Header -->
    <div 
      class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors select-none"
      @click="toggleCollapse"
    >
      <div class="flex items-center gap-3">
        <!-- Icon -->
        <SocialIcon 
          v-if="post.channel?.socialMedia" 
          :platform="post.channel.socialMedia" 
          class="shrink-0"
        />
        <UIcon v-else name="i-heroicons-document-text" class="w-5 h-5 text-gray-400" />
        
        <!-- Channel Name -->
        <span class="font-medium text-gray-900 dark:text-white">
          {{ post.channel?.name || t('common.unknownChannel') }}
        </span>

        <!-- Language Code (only when collapsed) -->
        <UBadge 
          v-if="isCollapsed && post.language" 
          variant="subtle" 
          color="neutral" 
          size="xs"
          class="ml-2 font-mono uppercase"
        >
          {{ post.language }}
        </UBadge>
      </div>

      <!-- Expand/Collapse Button -->
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        :icon="isCollapsed ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-up'"
        class="ml-2"
      />
    </div>

    <!-- Collapsible Content -->
    <div v-show="!isCollapsed" class="border-t border-gray-200 dark:border-gray-700/50 p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/20">
      
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

      <!-- Actions -->
      <div class="flex justify-end pt-2">
        <UButton
          color="primary"
          :loading="isLoading"
          @click="handleSave"
        >
          {{ t('common.save') }}
        </UButton>
      </div>

    </div>
  </div>
</template>
