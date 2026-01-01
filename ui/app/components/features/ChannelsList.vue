<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { ChannelWithProject } from '~/composables/useChannels'

type SocialMediaEnum = Database['public']['Enums']['social_media_enum']

const props = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const {
  channels,
  isLoading,
  fetchChannels,
  setFilter,
  socialMediaOptions,
  getSocialMediaDisplayName,
  getSocialMediaIcon,
  getSocialMediaColor,
} = useChannels()

// Local filter state
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')

const statusOptions = computed(() => [
  { value: 'all', label: t('common.all') },
  { value: 'active', label: t('channel.active') },
  { value: 'inactive', label: t('channel.inactive') }
])

// Fetch channels on mount
onMounted(() => {
  if (props.projectId) {
    fetchChannels(props.projectId)
  }
})

// Watch for filter changes
watch(statusFilter, (val) => {
  const map: Record<string, boolean | null> = {
    all: null,
    active: true,
    inactive: false
  }
  setFilter({
    isActive: map[val]
  })
  fetchChannels(props.projectId)
})


/**
 * Format date for display
 */
function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('channel.titlePlural') }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ channels.length }} {{ t('channel.titlePlural').toLowerCase() }}
        </p>
      </div>
      
      <div class="flex items-center gap-4">
         <!-- Radio Group Switcher -->
         <URadioGroup
            v-model="statusFilter"
            :options="statusOptions"
            :ui="{ 
                wrapper: 'relative flex items-center gap-4',
                fieldset: 'flex items-center gap-4' 
            }"
         />

        <UButton 
            icon="i-heroicons-plus" 
            color="primary" 
            :to="`/projects/${projectId}/channels/new`"
        >
            {{ t('channel.createChannel') }}
        </UButton>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3"
        />
        <p class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="channels.length === 0"
      class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center"
    >
      <UIcon
        name="i-heroicons-signal-slash"
        class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('channel.noChannelsFound') }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{
          statusFilter !== 'all'
            ? t('channel.noChannelsFiltered')
            : t('channel.noChannelsDescription')
        }}
      </p>
      <UButton
        v-if="statusFilter === 'all'"
        icon="i-heroicons-plus"
        :to="`/projects/${projectId}/channels/new`"
      >
        {{ t('channel.createChannel') }}
      </UButton>
    </div>

    <!-- Channels List -->
    <div v-else class="grid grid-cols-1 gap-4">
      <NuxtLink
        v-for="channel in channels"
        :key="channel.id"
        :to="`/projects/${projectId}/channels/${channel.id}`"
        class="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-100 dark:border-gray-700 p-4 sm:p-5"
      >
        <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
                 <!-- Header: Name + Social Media + Status -->
                 <div class="flex items-center gap-3 mb-2 flex-wrap">
                    <div 
                        class="flex-shrink-0 p-1.5 rounded-md"
                        :style="{ backgroundColor: getSocialMediaColor(channel.socialMedia) + '20' }"
                    >
                        <UIcon 
                            :name="getSocialMediaIcon(channel.socialMedia)" 
                            class="w-5 h-5"
                            :style="{ color: getSocialMediaColor(channel.socialMedia) }"
                        />
                    </div>
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {{ channel.name }}
                    </h3>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                         {{ getSocialMediaDisplayName(channel.socialMedia) }}
                    </span>
                    <UBadge 
                        v-if="!channel.isActive" 
                        color="neutral" 
                        variant="subtle" 
                        size="xs"
                    >
                        {{ t('channel.inactive') }}
                    </UBadge>
                    <UBadge 
                        v-else 
                        color="success" 
                        variant="subtle" 
                        size="xs"
                    >
                        {{ t('channel.active') }}
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

                    <div class="flex items-center gap-1.5" :title="t('common.lastPost')">
                        <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                        <span>
                           {{ t('common.lastPost') }}: {{ formatDate(channel.lastPostAt) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </NuxtLink>
    </div>

  </div>
</template>
