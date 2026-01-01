<script setup lang="ts">
import type { PostWithRelations } from '~/composables/usePosts'

const props = defineProps<{
  post: PostWithRelations
  showChannelInfo?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', post: PostWithRelations): void
  (e: 'delete', post: PostWithRelations): void
}>()

const { t } = useI18n()
const { getStatusColor, getStatusDisplayName, getTypeDisplayName, canDelete } = usePosts()

function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

function formatDateTime(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

function truncateContent(content: string | null | undefined, maxLength = 150): string {
  if (!content) return ''
  const text = content.replace(/<[^>]*>/g, '').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function handleClick() {
  emit('click', props.post)
}

function handleDelete(e: Event) {
  e.stopPropagation()
  emit('delete', props.post)
}
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-4 sm:p-6"
    @click="handleClick"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 mb-2">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white truncate">
            {{ post.title || t('post.untitled', 'Untitled') }}
          </h3>
          <UBadge :color="getStatusColor(post.status)" size="xs" variant="subtle">
            {{ getStatusDisplayName(post.status) }}
          </UBadge>
          <UBadge color="neutral" size="xs" variant="outline">
            {{ getTypeDisplayName(post.postType) }}
          </UBadge>
          <span v-if="post.language !== post.channel?.language" class="text-[10px] px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded font-mono uppercase">
            {{ post.language }}
          </span>
        </div>
        <p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
          {{ truncateContent(post.content) }}
        </p>
        <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1">
            <UIcon name="i-heroicons-calendar" class="w-3.5 h-3.5" />
            {{ formatDate(post.createdAt) }}
          </span>
          <span
            v-if="post.status === 'SCHEDULED' && post.scheduledAt"
            class="flex items-center gap-1 text-amber-600 dark:text-amber-400"
          >
            <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
            {{ formatDateTime(post.scheduledAt) }}
          </span>
          <span v-if="showChannelInfo && post.channel" class="flex items-center gap-1">
            <UIcon name="i-heroicons-hashtag" class="w-3.5 h-3.5" />
            {{ post.channel.name }}
            <span class="ml-1 text-[10px] px-1 bg-gray-100 dark:bg-gray-700 rounded uppercase font-mono">
                {{ post.channel.language }}
            </span>
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-pencil-square"
          size="sm"
          @click="handleClick"
        />
        <UButton
          v-if="canDelete(post)"
          color="error"
          variant="ghost"
          icon="i-heroicons-trash"
          size="sm"
          @click="handleDelete"
        />
      </div>
    </div>
  </div>
</template>
