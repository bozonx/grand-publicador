<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useChannels } from '~/composables/useChannels'
import { useArchive } from '~/composables/useArchive'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const {
  fetchChannel,
  currentChannel: channel,
  isLoading,
  toggleChannelActive,
} = useChannels()

const { archiveEntity } = useArchive()
const { ArchiveEntityType } = await import('~/types/archive.types')

const projectId = computed(() => route.params.id as string)
const channelId = computed(() => route.params.channelId as string)

// UI States
const isSaving = ref(false)
const isTogglingActive = ref(false)
const isDeleting = ref(false)
const showDeleteModal = ref(false)

// Fetch channel on mount
onMounted(async () => {
  if (channelId.value) {
    await fetchChannel(channelId.value)
  }
})

/**
 * Navigate back to channel details
 */
function goBack() {
  router.push(`/projects/${projectId.value}/channels/${channelId.value}`)
}

/**
 * Handle channel update success
 */
function handleUpdateSuccess(channel: any) {
  fetchChannel(channelId.value)
}

/**
 * Handle channel activation/deactivation
 */
async function handleToggleActive() {
  if (!channel.value) return
  isTogglingActive.value = true
  try {
    await toggleChannelActive(channel.value.id)
  } finally {
    isTogglingActive.value = false
  }
}

/**
 * Handle channel archiving
 */
async function handleArchive() {
  if (!channel.value) return
  isDeleting.value = true
  try {
    await archiveEntity(ArchiveEntityType.CHANNEL, channel.value.id)
    router.push(`/projects/${projectId.value}`)
  } catch (e) {
    // handled in useArchive
  } finally {
    isDeleting.value = false
    showDeleteModal.value = false
  }
}
</script>

<template>
  <div>
    <!-- Back button -->
    <div class="mb-6">
      <UButton variant="ghost" color="neutral" icon="i-heroicons-arrow-left" @click="goBack">
        {{ t('common.back_to_channel', 'Back to Channel') }}
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !channel" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3"
        />
        <p class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <div v-else-if="channel">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ t('channel.settings', 'Channel Settings') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            {{ t('channel.settings_description', 'Manage your channel connection and settings') }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-8">
        <!-- General Settings -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('channel.general_settings', 'General Settings') }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('channel.general_settings_desc', 'Update your channel name and connection details') }}
            </p>
          </template>
          
          <FormsChannelForm
            :project-id="projectId"
            :channel="channel"
            @success="handleUpdateSuccess"
            @cancel="goBack"
            hide-header
          />
        </UCard>

        <!-- Channel Control -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('channel.control', 'Channel Control') }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('channel.control_desc', 'Activate or deactivate this channel for posting') }}
            </p>
          </template>
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">
                {{ channel.isActive ? t('channel.deactivate') : t('channel.activate') }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ channel.isActive 
                  ? t('channel.deactivate_warning', 'Deactivating the channel will stop all scheduled posts.') 
                  : t('channel.activate_info', 'Activating the channel will resume posting for scheduled posts.') 
                }}
              </p>
            </div>
            <UButton
              :color="channel.isActive ? 'warning' : 'success'"
              variant="solid"
              :icon="channel.isActive ? 'i-heroicons-pause' : 'i-heroicons-play'"
              :loading="isTogglingActive"
              @click="handleToggleActive"
            >
              {{ channel.isActive ? t('channel.deactivate') : t('channel.activate') }}
            </UButton>
          </div>
        </UCard>

        <!-- Danger Zone -->
        <UCard class="border-red-200 dark:border-red-900">
          <template #header>
            <h2 class="text-lg font-semibold text-red-600 dark:text-red-400">
              {{ t('common.danger_zone', 'Danger Zone') }}
            </h2>
          </template>
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">
                {{ t('project.moveToArchive') || t('channel.deleteChannel') }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ t('channel.deleteConfirm') }}
              </p>
            </div>
            <UButton
              color="error"
              variant="solid"
              icon="i-heroicons-trash"
              @click="showDeleteModal = true"
            >
              {{ t('project.moveToArchive') || t('common.delete') }}
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <UModal v-model:open="showDeleteModal">
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
              {{ t('project.moveToArchive') || t('channel.deleteChannel') }}
            </h3>
          </div>

          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t('channel.deleteConfirm') }}
          </p>

          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="isDeleting" @click="showDeleteModal = false">
              {{ t('common.cancel') }}
            </UButton>
            <UButton color="error" :loading="isDeleting" @click="handleArchive">
              {{ t('project.moveToArchive') || t('common.delete') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
