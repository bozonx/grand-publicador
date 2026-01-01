<script setup lang="ts">
import { useChannels } from '~/composables/useChannels'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const { 
  channels, 
  fetchChannels, 
  isLoading, 
  getSocialMediaIcon, 
  getSocialMediaColor, 
  getSocialMediaDisplayName 
} = useChannels()

const searchQuery = ref('')

// Fetch all user channels on mount
onMounted(async () => {
    await fetchChannels()
})

const filteredChannels = computed(() => {
    if (!searchQuery.value) return channels.value
    
    const query = searchQuery.value.toLowerCase()
    return channels.value.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.channelIdentifier.toLowerCase().includes(query) ||
        c.project?.name?.toLowerCase().includes(query)
    )
})

function getStatusColor(isActive: boolean): 'success' | 'neutral' {
    return isActive ? 'success' : 'neutral'
}

function formatDate(date: string | null | undefined): string {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('channel.titlePlural') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('navigation.channels') }}
        </p>
      </div>
    </div>

    <!-- Search and filters -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          :placeholder="t('common.search')"
          size="md"
          class="w-full"
        />
      </div>
    </div>

    <!-- Channels list -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
       <div v-if="isLoading && channels.length === 0" class="col-span-full flex items-center justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
       </div>

       <div v-else-if="filteredChannels.length === 0" class="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-heroicons-hashtag" class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ t('channel.noChannelsFound') }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            {{ searchQuery ? t('channel.noChannelsFiltered') : t('channel.noChannelsDescription') }}
          </p>
       </div>

       <NuxtLink
          v-for="channel in filteredChannels"
          :key="channel.id"
          :to="`/projects/${channel.projectId}/channels/${channel.id}`"
          class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all p-6 flex flex-col gap-4 group border border-transparent hover:border-primary-500/10"
       >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
                :style="{ backgroundColor: getSocialMediaColor(channel.socialMedia) }"
              >
                <UIcon :name="getSocialMediaIcon(channel.socialMedia)" class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <h3 class="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {{ channel.name }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
                  {{ channel.channelIdentifier }}
                </p>
              </div>
            </div>
            <UBadge :color="getStatusColor(channel.isActive)" variant="subtle" size="xs" class="shrink-0">
                {{ channel.isActive ? t('channel.active') : t('channel.inactive') }}
            </UBadge>
          </div>

          <div class="mt-auto space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
             <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">{{ t('project.title') }}</span>
                <span class="text-gray-900 dark:text-white font-medium truncate ml-2 max-w-[150px]">
                  {{ channel.project?.name || '-' }}
                </span>
             </div>
             <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">{{ t('post.titlePlural') }}</span>
                <span class="text-gray-900 dark:text-white font-medium">
                  {{ channel.postsCount || 0 }}
                </span>
             </div>
             <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">{{ t('common.lastPost') }}</span>
                <span class="text-gray-900 dark:text-white font-medium">
                  {{ formatDate(channel.lastPostAt) }}
                </span>
             </div>
          </div>
       </NuxtLink>
    </div>
  </div>
</template>
