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
  deleteChannel,
  toggleChannelActive,
  filter,
  setFilter,
  clearFilter,
  socialMediaOptions,
  getSocialMediaDisplayName,
  getSocialMediaIcon,
  getSocialMediaColor,
} = useChannels()

// Modal states
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const channelToEdit = ref<ChannelWithProject | null>(null)
const channelToDelete = ref<ChannelWithProject | null>(null)
const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)

// Local filter state for reactive updates
const selectedSocialMedia = ref<SocialMediaEnum | null>(null)
const selectedActiveStatus = ref<boolean | null>(null)
const searchQuery = ref('')

// Fetch channels on mount
onMounted(() => {
  if (props.projectId) {
    fetchChannels(props.projectId)
  }
})

// Watch for filter changes
watch(
  [selectedSocialMedia, selectedActiveStatus, searchQuery],
  () => {
    setFilter({
      socialMedia: selectedSocialMedia.value,
      isActive: selectedActiveStatus.value,
      search: searchQuery.value || undefined,
    })
    fetchChannels(props.projectId)
  },
  { debounce: 300 } as any
)

/**
 * Open edit modal with channel data
 */
function openEditModal(channel: ChannelWithProject) {
  channelToEdit.value = channel
  isEditModalOpen.value = true
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(channel: ChannelWithProject) {
  channelToDelete.value = channel
  isDeleteModalOpen.value = true
}

/**
 * Handle channel deletion
 */
async function handleDelete() {
  if (!channelToDelete.value) return

  isDeleting.value = true
  const success = await deleteChannel(channelToDelete.value.id)
  isDeleting.value = false

  if (success) {
    isDeleteModalOpen.value = false
    channelToDelete.value = null
  }
}

/**
 * Handle channel creation success
 */
function handleCreateSuccess() {
  isCreateModalOpen.value = false
  fetchChannels(props.projectId)
}

/**
 * Handle channel update success
 */
function handleUpdateSuccess() {
  isEditModalOpen.value = false
  channelToEdit.value = null
  fetchChannels(props.projectId)
}

/**
 * Handle toggle active status
 */
async function handleToggleActive(channel: ChannelWithProject) {
  await toggleChannelActive(channel.id)
}

/**
 * Reset all filters
 */
function resetFilters() {
  selectedSocialMedia.value = null
  selectedActiveStatus.value = null
  searchQuery.value = ''
  clearFilter()
  fetchChannels(props.projectId)
}

/**
 * Get status badge color
 */
function getStatusColor(isActive: boolean | null): 'success' | 'neutral' {
  return isActive ? 'success' : 'neutral'
}

/**
 * Format date for display
 */
function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

// Active status options for filter
const activeStatusOptions = [
  { value: null, label: t('common.all') },
  { value: true, label: t('channel.active') },
  { value: false, label: t('channel.inactive') },
]
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
      <UButton icon="i-heroicons-plus" color="primary" @click="isCreateModalOpen = true">
        {{ t('channel.createChannel') }}
      </UButton>
    </div>

    <!-- Filters -->
    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Search -->
        <UInput
          v-model="searchQuery"
          :placeholder="t('common.search')"
          icon="i-heroicons-magnifying-glass"
          class="w-full"
        />

        <!-- Social media filter -->
        <USelect
          v-model="selectedSocialMedia"
          :options="[{ value: null, label: t('common.all') }, ...socialMediaOptions]"
          option-attribute="label"
          value-attribute="value"
          :placeholder="t('channel.socialMedia')"
          class="w-full"
        />

        <!-- Active status filter -->
        <USelect
          v-model="selectedActiveStatus"
          :options="activeStatusOptions"
          option-attribute="label"
          value-attribute="value"
          :placeholder="t('channel.isActive')"
          class="w-full"
        />

        <!-- Reset filters -->
        <UButton
          v-if="selectedSocialMedia || selectedActiveStatus !== null || searchQuery"
          variant="ghost"
          color="neutral"
          icon="i-heroicons-x-mark"
          @click="resetFilters"
        >
          {{ t('common.reset') }}
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
          filter.socialMedia || filter.search
            ? t('channel.noChannelsFiltered')
            : t('channel.noChannelsDescription')
        }}
      </p>
      <UButton
        v-if="!filter.socialMedia && !filter.search"
        icon="i-heroicons-plus"
        @click="isCreateModalOpen = true"
      >
        {{ t('channel.createChannel') }}
      </UButton>
    </div>

    <!-- Channels grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="channel in channels"
        :key="channel.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
      >
        <!-- Card header with social media color bar -->
        <div class="h-1" :style="{ backgroundColor: getSocialMediaColor(channel.socialMedia) }" />

        <div class="p-4">
          <!-- Channel info -->
          <div class="flex items-start gap-3 mb-4">
            <div
              class="p-2 rounded-lg"
              :style="{ backgroundColor: getSocialMediaColor(channel.socialMedia) + '20' }"
            >
              <UIcon
                :name="getSocialMediaIcon(channel.socialMedia)"
                class="w-6 h-6"
                :style="{ color: getSocialMediaColor(channel.socialMedia) }"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-gray-900 dark:text-white truncate">
                {{ channel.name }}
              </h4>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ getSocialMediaDisplayName(channel.socialMedia) }}
              </p>
            </div>
            <UBadge :color="getStatusColor(channel.isActive)" size="xs" variant="subtle">
              {{ channel.isActive ? t('channel.active') : t('channel.inactive') }}
            </UBadge>
          </div>

          <!-- Channel identifier -->
          <div class="mb-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm">
            <span class="text-gray-500 dark:text-gray-400">ID: </span>
            <span class="font-mono text-gray-900 dark:text-white">{{
              channel.channelIdentifier
            }}</span>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
              {{ channel.postsCount || 0 }} {{ t('post.titlePlural').toLowerCase() }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
              {{ formatDate(channel.createdAt) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              @click="openEditModal(channel)"
            >
              {{ t('common.edit') }}
            </UButton>
            <UButton
              size="xs"
              :color="channel.isActive ? 'warning' : 'success'"
              variant="ghost"
              :icon="channel.isActive ? 'i-heroicons-pause' : 'i-heroicons-play'"
              @click="handleToggleActive(channel)"
            >
              {{ channel.isActive ? t('channel.deactivate') : t('channel.activate') }}
            </UButton>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              @click="openDeleteModal(channel)"
            >
              {{ t('common.delete') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Channel Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div class="p-6">
          <FormsChannelForm
            :project-id="projectId"
            @success="handleCreateSuccess"
            @cancel="isCreateModalOpen = false"
          />
        </div>
      </template>
    </UModal>

    <!-- Edit Channel Modal -->
    <UModal v-model:open="isEditModalOpen">
      <template #content>
        <div class="p-6">
          <FormsChannelForm
            v-if="channelToEdit"
            :project-id="projectId"
            :channel="channelToEdit"
            @success="handleUpdateSuccess"
            @cancel="
              isEditModalOpen = false;
              channelToEdit = null;
            "
          />
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-6 h-6 text-red-600 dark:text-red-400"
              />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('channel.deleteChannel') }}
            </h3>
          </div>

          <p class="text-gray-600 dark:text-gray-400 mb-2">
            {{ t('channel.deleteConfirm') }}
          </p>

          <p
            v-if="channelToDelete?.postsCount && channelToDelete.postsCount > 0"
            class="text-amber-600 dark:text-amber-400 text-sm mb-6"
          >
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-1" />
            {{ t('channel.deleteWithPostsWarning', { count: channelToDelete.postsCount }) }}
          </p>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="isDeleting"
              @click="
                isDeleteModalOpen = false;
                channelToDelete = null;
              "
            >
              {{ t('common.cancel') }}
            </UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">
              {{ t('common.delete') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
