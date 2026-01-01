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
  fetchArchivedChannels,
  setFilter,
  socialMediaOptions,
  getSocialMediaDisplayName,
  getSocialMediaIcon,
  getSocialMediaColor
} = useChannels()

// Sorting
interface SortOption {
  id: string
  label: string
  icon: string
}

const sortOptions = computed<SortOption[]>(() => [
  { id: 'alphabetical', label: t('channel.sort.alphabetical'), icon: 'i-heroicons-bars-3-bottom-left' },
  { id: 'activity', label: t('channel.sort.activity'), icon: 'i-heroicons-bolt' },
  { id: 'socialMedia', label: t('channel.sort.socialMedia'), icon: 'i-heroicons-share' }
])

const sortBy = ref(localStorage.getItem('channels-sort-by') || 'alphabetical')
const sortOrder = ref<'asc' | 'desc'>((localStorage.getItem('channels-sort-order') as 'asc' | 'desc') || 'asc')

watch(sortBy, (val) => localStorage.setItem('channels-sort-by', val))
watch(sortOrder, (val) => localStorage.setItem('channels-sort-order', val))

const socialMediaWeights: Record<string, number> = {
  FACEBOOK: 1,
  VK: 1,
  YOUTUBE: 2,
  TIKTOK: 2,
  INSTAGRAM: 2,
  TELEGRAM: 3,
  X: 4,
  LINKEDIN: 4,
  SITE: 4
}

function sortChannels(list: ChannelWithProject[]) {
  return [...list].sort((a, b) => {
    let result = 0
    if (sortBy.value === 'alphabetical') {
      result = a.name.localeCompare(b.name)
    } else if (sortBy.value === 'activity') {
      // Active first (isActive: true)
      const valA = a.isActive ? 1 : 0
      const valB = b.isActive ? 1 : 0
      result = valB - valA
      // Sub-sort by name
      if (result === 0) result = a.name.localeCompare(b.name)
    } else if (sortBy.value === 'socialMedia') {
      const weightA = socialMediaWeights[a.socialMedia] || 99
      const weightB = socialMediaWeights[b.socialMedia] || 99
      result = weightA - weightB
      // Sub-sort by name
      if (result === 0) result = a.name.localeCompare(b.name)
    }

    return sortOrder.value === 'asc' ? result : -result
  })
}

const currentSortOption = computed(() => sortOptions.value.find(opt => opt.id === sortBy.value))
const sortedChannels = computed(() => sortChannels(channels.value))

// Local filter state
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')
const archivedChannels = ref<ChannelWithProject[]>([])
const showArchived = ref(false)
const isLoadingArchived = ref(false)

const statusOptions = computed(() => [
  { value: 'all', label: t('common.all') },
  { value: 'active', label: t('channel.active') },
  { value: 'inactive', label: t('channel.inactive') }
])

// Fetch active channels on mount
onMounted(() => {
  if (props.projectId) {
    // Initialize filter with default values
    setFilter({
      isActive: null,
      includeArchived: false
    })
    fetchChannels(props.projectId)
  }
})

// Watch for status filter changes
watch(statusFilter, (statusVal) => {
  const map: Record<string, boolean | null> = {
    all: null,
    active: true,
    inactive: false
  }
  setFilter({
    isActive: map[statusVal],
    includeArchived: false
  })
  if (props.projectId) {
    fetchChannels(props.projectId)
  }
})

/**
 * Toggle archived channels visibility
 */
async function toggleArchivedChannels() {
  showArchived.value = !showArchived.value
  
  if (showArchived.value && archivedChannels.value.length === 0) {
    isLoadingArchived.value = true
    archivedChannels.value = await fetchArchivedChannels(props.projectId)
    isLoadingArchived.value = false
  }
}

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
      
      <div class="flex items-center gap-2">
        <USelectMenu
          v-model="sortBy"
          :items="sortOptions"
          value-key="id"
          label-key="label"
          class="w-56"
          :searchable="false"
        >
          <template #leading>
            <UIcon v-if="currentSortOption" :name="currentSortOption.icon" class="w-4 h-4" />
          </template>
        </USelectMenu>

        <UButton
          :icon="sortOrder === 'asc' ? 'i-heroicons-bars-arrow-up' : 'i-heroicons-bars-arrow-down'"
          color="neutral"
          variant="ghost"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          :title="sortOrder === 'asc' ? t('common.sortOrder.asc') : t('common.sortOrder.desc')"
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
    <div v-else class="space-y-4">
      <NuxtLink
        v-for="channel in sortedChannels"
        :key="channel.id"
        :to="`/projects/${projectId}/channels/${channel.id}`"
        class="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-100 dark:border-gray-700 p-4 sm:p-5"
      >
        <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
                 <!-- Header: Name + Social Media + Status -->
                 <div class="flex items-center gap-3 mb-2 flex-wrap">
                    <div 
                        class="shrink-0 p-1.5 rounded-md"
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
            <!-- Actions removed as per request -->
        </div>
      </NuxtLink>

      <!-- Show/Hide Archived Button -->
      <div class="flex justify-center pt-4">
        <UButton
          :icon="showArchived ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          variant="ghost"
          color="neutral"
          @click="toggleArchivedChannels"
          :loading="isLoadingArchived"
        >
          {{ showArchived ? 'Скрыть архивные' : 'Показать архивные' }}
        </UButton>
      </div>

      <!-- Archived Channels Section -->
      <div v-if="showArchived" class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div v-if="archivedChannels.length > 0">
          <NuxtLink
            v-for="channel in archivedChannels"
            :key="channel.id"
            :to="`/projects/${projectId}/channels/${channel.id}`"
            class="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-100 dark:border-gray-700 p-4 sm:p-5 opacity-75 grayscale-[0.5]"
          >
            <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                     <!-- Header: Name + Social Media + Status -->
                     <div class="flex items-center gap-3 mb-2 flex-wrap">
                        <div 
                            class="shrink-0 p-1.5 rounded-md"
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
        <div v-else class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">Нет архивных каналов</p>
        </div>
      </div>
    </div>


  </div>
</template>
