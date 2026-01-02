<script setup lang="ts">
import type { ChannelWithProject } from '~/composables/useChannels'
import { getSocialMediaDisplayName } from '~/utils/socialMedia'
import SocialIcon from '~/components/common/SocialIcon.vue'

const props = defineProps<{
  channel: ChannelWithProject
  isArchived?: boolean
}>()

const { t, d } = useI18n()

function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return d(new Date(date), 'short')
}
</script>

<template>
  <div
    class="block app-card app-card-hover p-4 sm:p-5 cursor-pointer relative"
    :class="{ 'opacity-60 grayscale': isArchived }"
    @click="navigateTo(`/projects/${channel.projectId}/channels/${channel.id}`)"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <!-- Header: Name + Social Media + Status -->
        <div class="flex items-center gap-3 mb-2 flex-wrap">
          <SocialIcon 
            :platform="channel.socialMedia" 
            show-background 
          />
          
          <h3 class="text-base font-semibold text-gray-900 dark:text-white truncate">
            {{ channel.name }}
          </h3>

          <!-- Language -->
          <div class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400" :title="t('channel.language')">
            <UIcon name="i-heroicons-language" class="w-4 h-4" />
            <span class="font-medium uppercase">
              {{ channel.language }}
            </span>
          </div>
          
          <UBadge 
            v-if="!channel.isActive" 
            color="warning" 
            variant="subtle" 
            size="xs"
          >
            {{ t('channel.inactive') }}
          </UBadge>
        </div>

        <!-- ID -->
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 font-mono">
          ID: {{ channel.channelIdentifier }}
        </p>

        <!-- Metrics -->
        <div class="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div class="flex items-center gap-1.5" :title="t('post.titlePlural')">
            <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
            <span>
              {{ channel.postsCount || 0 }} {{ t('post.titlePlural').toLowerCase() }}
            </span>
          </div>

          <div class="flex items-center gap-1.5" :title="t('common.lastPublishedPost')">
            <UIcon name="i-heroicons-clock" class="w-4 h-4" />
            <span>
              {{ t('common.lastPost') }}: 
              <NuxtLink 
                v-if="channel.lastPublicationId"
                :to="`/projects/${channel.projectId}/publications/${channel.lastPublicationId}`"
                class="hover:underline hover:text-primary-500 font-medium relative z-10"
                @click.stop
              >
                {{ formatDate(channel.lastPostAt) }}
              </NuxtLink>
              <span v-else>
                {{ formatDate(channel.lastPostAt) }}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
