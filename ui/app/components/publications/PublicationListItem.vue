<script setup lang="ts">
import type { PublicationWithRelations } from '~/composables/usePublications'

const props = defineProps<{
  publication: PublicationWithRelations
  showProjectInfo?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', publication: PublicationWithRelations): void
}>()

const { t, d } = useI18n()
const { getStatusColor, getStatusDisplayName } = usePublications()

function truncateContent(content: string | null | undefined, maxLength = 150): string {
  if (!content) return ''
  const text = content.replace(/<[^>]*>/g, '').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function handleClick() {
  emit('click', props.publication)
}
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all cursor-pointer p-4 sm:p-6 border border-transparent hover:border-primary-500/20"
    @click="handleClick"
  >
    <div class="flex flex-col h-full">
      <div class="flex items-start justify-between gap-4 mb-2">
        <h3 class="font-semibold text-gray-900 dark:text-white truncate text-lg">
          {{ publication.title || t('post.untitled') }}
        </h3>
        <div class="flex items-center gap-2">
            <span class="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded font-mono uppercase">
                {{ publication.language }}
            </span>
            <UBadge :color="getStatusColor(publication.status)" size="sm" variant="subtle">
                {{ getStatusDisplayName(publication.status) }}
            </UBadge>
        </div>
      </div>

      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 grow">
        {{ truncateContent(publication.content) }}
      </p>

      <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
        <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1">
            <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
            {{ d(new Date(publication.createdAt), 'short') }}
          </span>
          
          <span v-if="showProjectInfo && publication.projectId" class="flex items-center gap-1">
             <UIcon name="i-heroicons-briefcase" class="w-4 h-4" />
             {{ publication.projectId.slice(0, 8) }}...
          </span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Channel icons -->
          <div v-if="publication.posts && publication.posts.length > 0" class="flex -space-x-2 overflow-hidden">
            <UTooltip
              v-for="post in publication.posts.slice(0, 5)"
              :key="post.id"
              :text="`${post.channel?.name || post.socialMedia} (${post.channel?.language || post.socialMedia})`"
            >
              <div class="h-7 w-7 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <UIcon 
                  :name="post.channel?.socialMedia === 'TELEGRAM' ? 'i-logos-telegram' : 'i-heroicons-paper-airplane'" 
                  class="w-4 h-4" 
                />
              </div>
            </UTooltip>
            <div v-if="publication.posts.length > 5" class="h-7 w-7 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-500 font-medium">
              +{{ publication.posts.length - 5 }}
            </div>
          </div>
          
          <div v-if="publication._count?.posts" class="text-xs font-medium text-primary-600 dark:text-primary-400 ml-2">
            {{ publication._count.posts }} {{ t('channel.titlePlural').toLowerCase() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
