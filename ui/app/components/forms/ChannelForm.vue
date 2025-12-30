<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type {
  ChannelWithProject,
  ChannelCreateInput,
  ChannelUpdateInput,
} from '~/composables/useChannels'

type SocialMediaEnum = Database['public']['Enums']['social_media_enum']

interface Props {
  /** Project ID for creating new channel */
  projectId: string
  /** Channel data for editing, null for creating new */
  channel?: ChannelWithProject | null
}

interface Emits {
  (e: 'success' | 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  channel: null,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()
const {
  createChannel,
  updateChannel,
  socialMediaOptions,
  isLoading,
  getSocialMediaIcon,
  getSocialMediaColor,
} = useChannels()

const isEditMode = computed(() => !!props.channel?.id)

// Form state
const state = reactive({
  name: props.channel?.name || '',
  socialMedia: (props.channel?.socialMedia || 'telegram') as SocialMediaEnum,
  channelIdentifier: props.channel?.channelIdentifier || '',
  isActive: props.channel?.isActive ?? true,
})

/**
 * Form submission handler
 */
async function handleSubmit() {
  if (!state.name || !state.channelIdentifier) return

  if (isEditMode.value && props.channel) {
    // Update existing channel
    const updateData: ChannelUpdateInput = {
      name: state.name,
      channelIdentifier: state.channelIdentifier,
      isActive: state.isActive,
    }

    const result = await updateChannel(props.channel.id, updateData)
    if (result) {
      emit('success')
    }
  } else {
    // Create new channel
    const result = await createChannel({
      projectId: props.projectId,
      name: state.name,
      socialMedia: state.socialMedia,
      channelIdentifier: state.channelIdentifier,
      isActive: state.isActive,
    })

    if (result) {
      emit('success')
    }
  }
}

function handleCancel() {
  emit('cancel')
}

/**
 * Get identifier placeholder based on selected social media
 */
function getIdentifierPlaceholder(socialMedia: SocialMediaEnum | undefined): string {
  const placeholders: Record<SocialMediaEnum, string> = {
    telegram: '@channel_name',
    instagram: '@username',
    vk: 'club123456789',
    youtube: '@channelhandle',
    tiktok: '@username',
    x: '@username',
    facebook: 'page_username',
    site: 'https://example.com',
  }
  return socialMedia ? placeholders[socialMedia] : t('channel.identifierPlaceholder')
}

/**
 * Get identifier help text based on selected social media
 */
function getIdentifierHelp(socialMedia: SocialMediaEnum | undefined): string {
  const helps: Record<SocialMediaEnum, string> = {
    telegram: t('channel.identifierHelpTelegram'),
    instagram: t('channel.identifierHelpInstagram'),
    vk: t('channel.identifierHelpVk'),
    youtube: t('channel.identifierHelpYoutube'),
    tiktok: t('channel.identifierHelpTiktok'),
    x: t('channel.identifierHelpX'),
    facebook: t('channel.identifierHelpFacebook'),
    site: t('channel.identifierHelpSite'),
  }
  return socialMedia ? helps[socialMedia] : t('channel.identifierHelp')
}

const currentSocialMedia = computed(() => (isEditMode.value ? props.channel?.socialMedia : state.socialMedia))
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ isEditMode ? t('channel.editChannel') : t('channel.createChannel') }}
      </h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ isEditMode ? t('channel.editDescription') : t('channel.createDescription') }}
      </p>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Channel name -->
      <UFormField :label="t('channel.name')" required>
        <UInput
          v-model="state.name"
          :placeholder="t('channel.namePlaceholder')"
          class="w-full"
          size="lg"
        />
      </UFormField>

      <!-- Social media type (only for create mode) -->
      <div v-if="!isEditMode">
        <UFormField :label="t('channel.socialMedia')" required>
          <USelectMenu
            v-model="state.socialMedia"
            :items="socialMediaOptions"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>

        <!-- Social media preview -->
        <div
          v-if="state.socialMedia"
          class="mt-2 flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
        >
          <div
            class="p-1.5 rounded"
            :style="{ backgroundColor: getSocialMediaColor(state.socialMedia) + '20' }"
          >
            <UIcon
              :name="getSocialMediaIcon(state.socialMedia)"
              class="w-4 h-4"
              :style="{ color: getSocialMediaColor(state.socialMedia) }"
            />
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ socialMediaOptions.find((o) => o.value === state.socialMedia)?.label }}
          </span>
        </div>
      </div>

      <!-- Display current social media for edit mode -->
      <div v-else class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t('channel.socialMedia') }}
        </label>
        <div
          class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
        >
          <div
            class="p-2 rounded"
            :style="{
              backgroundColor: getSocialMediaColor(channel?.socialMedia || 'telegram') + '20',
            }"
          >
            <UIcon
              :name="getSocialMediaIcon(channel?.socialMedia || 'telegram')"
              class="w-5 h-5"
              :style="{ color: getSocialMediaColor(channel?.socialMedia || 'telegram') }"
            />
          </div>
          <span class="font-medium text-gray-900 dark:text-white">
            {{ socialMediaOptions.find((o) => o.value === channel?.socialMedia)?.label }}
          </span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('channel.socialMediaCannotChange') }}
        </p>
      </div>

      <!-- Channel identifier -->
      <UFormField
        :label="t('channel.identifier')"
        required
        :help="getIdentifierHelp(currentSocialMedia)"
      >
        <UInput
          v-model="state.channelIdentifier"
          :placeholder="getIdentifierPlaceholder(currentSocialMedia)"
          class="w-full"
        />
      </UFormField>

      <!-- Active status -->
      <div class="flex items-start gap-3">
        <UCheckbox v-model="state.isActive" :label="t('channel.isActive')" />
      </div>
      <p class="ml-7 text-xs text-gray-500 dark:text-gray-400">
        {{ t('channel.isActiveHelp') }}
      </p>

      <!-- Form actions -->
      <div
        class="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <UButton
          type="button"
          color="neutral"
          variant="ghost"
          :disabled="isLoading"
          @click="handleCancel"
        >
          {{ t('common.cancel') }}
        </UButton>
        <UButton
          type="submit"
          color="primary"
          :loading="isLoading"
          :disabled="!state.name || !state.channelIdentifier"
        >
          {{ isEditMode ? t('common.save') : t('common.create') }}
        </UButton>
      </div>
    </form>
  </div>
</template>
