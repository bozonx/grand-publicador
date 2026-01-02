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

const { t, d } = useI18n()
const { getStatusColor, getStatusDisplayName, getTypeDisplayName, canDelete } = usePosts()

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
    class="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-5 border border-gray-100 dark:border-gray-700/50 hover:border-primary-500/30 group"
    @click="handleClick"
  >
    <div class="flex flex-col h-full">
      <!-- Title and Action Buttons -->
      <div class="flex items-start justify-between gap-4 mb-3">
        <div class="flex flex-col gap-2 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate leading-tight">
              {{ post.title || t('post.untitled') }}
            </h3>
            
            <UBadge :color="getStatusColor(post.status)" size="xs" variant="subtle" class="capitalize">
              {{ getStatusDisplayName(post.status) }}
            </UBadge>
            
            <UBadge color="neutral" size="xs" variant="outline" class="font-normal text-[10px]">
              {{ getTypeDisplayName(post.postType) }}
            </UBadge>
            
            <span class="text-[10px] px-1.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded font-mono uppercase border border-orange-200/50 dark:border-orange-500/20">
              {{ post.language }}
            </span>
          </div>
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-1 -mt-1 -mr-1">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-pencil-square"
            size="xs"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click="handleClick"
          />
          <UButton
            v-if="canDelete(post)"
            color="error"
            variant="ghost"
            icon="i-heroicons-trash"
            size="xs"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click="handleDelete"
          />
        </div>
      </div>

      <!-- Content Snippet (Only if meaningful content exists) -->
      <p v-if="post.content" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-4 grow italic">
        {{ truncateContent(post.content, 100) }}
      </p>

      <!-- Footer -->
      <div class="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <div class="flex items-center gap-4 text-[12px] text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1.5">
            <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
            {{ d(new Date(post.createdAt), 'short') }}
          </span>
          
          <span v-if="post.scheduledAt && post.status === 'SCHEDULED'" class="flex items-center gap-1.5 text-amber-500">
            <UIcon name="i-heroicons-clock" class="w-4 h-4" />
            {{ d(new Date(post.scheduledAt), 'long') }}
          </span>
        </div>

        <!-- Optional Channel Link if needed outside channel page context -->
        <div v-if="showChannelInfo && post.channel" class="flex items-center gap-1.5 text-[11px] bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700">
          <UIcon 
            :name="post.channel.socialMedia === 'TELEGRAM' ? 'i-logos-telegram' : 'i-heroicons-hashtag'" 
            class="w-3 h-3" 
          />
          <span>{{ post.channel.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
