<script setup lang="ts">
import type {
  ChannelWithProject,
  ChannelCreateInput,
  ChannelUpdateInput,
  SocialMedia,
} from '~/composables/useChannels'

interface Props {
  /** Project ID for creating new channel */
  projectId: string
  /** Channel data for editing, null for creating new */
  channel?: ChannelWithProject | null
  /** Whether to hide the header */
  hideHeader?: boolean
  /** Whether to hide the cancel button */
  hideCancel?: boolean
}

interface Emits {
  (e: 'success', channel: any): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  channel: null,
  hideHeader: false,
  hideCancel: false,
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

const { languageOptions } = useLanguages()
const { projects, fetchProjects } = useProjects()

const isEditMode = computed(() => !!props.channel?.id)

// Helper function to format date
function formatDate(date: string | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleString()
}

// Fetch projects for the selector
if (isEditMode.value) {
  fetchProjects()
}

const state = reactive({
  name: props.channel?.name || '',
  socialMedia: (props.channel?.socialMedia || 'TELEGRAM') as SocialMedia,
  channelIdentifier: props.channel?.channelIdentifier || '',
  language: props.channel?.language || 'en-US',
  projectId: props.channel?.projectId || props.projectId,
  isActive: props.channel?.isActive ?? true,
  credentials: {
    telegramChannelId: props.channel?.credentials?.telegramChannelId || '',
    telegramBotToken: props.channel?.credentials?.telegramBotToken || '',
    vkAccessToken: props.channel?.credentials?.vkAccessToken || '',
  }
})

/**
 * Form submission handler
 */
async function handleSubmit() {
  if (!state.name || !state.channelIdentifier || !state.language) return

  if (isEditMode.value && props.channel) {
    // Update existing channel
    const updateData: ChannelUpdateInput = {
      name: state.name,
      channelIdentifier: state.channelIdentifier,
      projectId: state.projectId,
    }

    // Add credentials for supported channels
    if (props.channel.socialMedia === 'TELEGRAM') {
      updateData.credentials = {
        telegramChannelId: state.credentials.telegramChannelId,
        telegramBotToken: state.credentials.telegramBotToken,
      }
    } else if (props.channel.socialMedia === 'VK') {
      updateData.credentials = {
        vkAccessToken: state.credentials.vkAccessToken,
      }
    }

    const result = await updateChannel(props.channel.id, updateData)
    if (result) {
      emit('success', result)
    }
  } else {
    // Create new channel
    const createData: ChannelCreateInput = {
      projectId: props.projectId,
      name: state.name,
      socialMedia: state.socialMedia,
      channelIdentifier: state.channelIdentifier,
      language: state.language,
      isActive: state.isActive,
    }

    // Add credentials for supported channels
    if (state.socialMedia === 'TELEGRAM') {
      createData.credentials = {
        telegramChannelId: state.credentials.telegramChannelId,
        telegramBotToken: state.credentials.telegramBotToken,
      }
    } else if (state.socialMedia === 'VK') {
      createData.credentials = {
        vkAccessToken: state.credentials.vkAccessToken,
      }
    }

    const result = await createChannel(createData)

    if (result) {
      emit('success', result)
    }
  }
}

function handleCancel() {
  emit('cancel')
}

/**
 * Get identifier placeholder based on selected social media
 */
function getIdentifierPlaceholder(socialMedia: SocialMedia | undefined): string {
  const placeholders: Record<SocialMedia, string> = {
    TELEGRAM: '@channel_name',
    INSTAGRAM: '@username',
    VK: 'club123456789',
    YOUTUBE: '@channelhandle',
    TIKTOK: '@username',
    X: '@username',
    FACEBOOK: 'page_username',
    SITE: 'https://example.com',
    LINKEDIN: 'username',
  }
  return socialMedia ? placeholders[socialMedia] : t('channel.identifierPlaceholder')
}

/**
 * Get identifier help text based on selected social media
 */
function getIdentifierHelp(socialMedia: SocialMedia | undefined): string {
  const helps: Record<SocialMedia, string> = {
    TELEGRAM: t('channel.identifierHelpTelegram'),
    INSTAGRAM: t('channel.identifierHelpInstagram'),
    VK: t('channel.identifierHelpVk'),
    YOUTUBE: t('channel.identifierHelpYoutube'),
    TIKTOK: t('channel.identifierHelpTiktok'),
    X: t('channel.identifierHelpX'),
    FACEBOOK: t('channel.identifierHelpFacebook'),
    SITE: t('channel.identifierHelpSite'),
    LINKEDIN: t('channel.identifierHelpLinkedin'),
  }
  return socialMedia ? helps[socialMedia] : t('channel.identifierHelp')
}

const currentSocialMedia = computed(() => (isEditMode.value ? props.channel?.socialMedia : state.socialMedia))

const projectOptions = computed(() => 
  projects.value.map(project => ({
    value: project.id,
    label: project.name
  }))
)
</script>

<template>
  <div :class="[hideHeader ? '' : 'bg-white dark:bg-gray-800 rounded-lg shadow p-6']">
    <div v-if="!hideHeader" class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ isEditMode ? t('channel.editChannel') : t('channel.createChannel') }}
      </h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ isEditMode ? t('channel.editDescription') : t('channel.createDescription') }}
      </p>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Created date (read-only, edit mode only) -->
      <div v-if="isEditMode && channel?.createdAt" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t('channel.createdAt', 'Created At') }}
        </label>
        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <span class="text-gray-900 dark:text-white">{{ formatDate(channel.createdAt) }}</span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('channel.createdAtHelp', 'The date when this channel was created') }}
        </p>
      </div>

      <!-- Channel language -->
      <div v-if="!isEditMode">
        <UFormField
          :label="t('channel.language')"
          required
          :help="t('channel.languageHelp')"
        >
          <USelectMenu
            v-model="state.language"
            :items="languageOptions"
            value-key="value"
            label-key="label"
            class="w-full"
          >
            <template #leading>
              <span v-if="state.language" class="flex items-center gap-2">
                <UIcon name="i-heroicons-language" class="w-4 h-4" />
                {{ languageOptions.find(o => o.value === state.language)?.label }}
              </span>
              <span v-else>Select language</span>
            </template>
          </USelectMenu>
        </UFormField>
      </div>
      <!-- Display current language for edit mode (read-only) -->
      <div v-else class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t('channel.language') }}
        </label>
        <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <UIcon name="i-heroicons-language" class="w-5 h-5 text-gray-500" />
          <span class="font-medium text-gray-900 dark:text-white">
            {{ languageOptions.find(o => o.value === channel?.language)?.label || channel?.language }}
          </span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('channel.languageCannotChange', 'Language cannot be changed after channel creation') }}
        </p>
      </div>

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
              backgroundColor: getSocialMediaColor(channel?.socialMedia || 'TELEGRAM') + '20',
            }"
          >
            <UIcon
              :name="getSocialMediaIcon(channel?.socialMedia || 'TELEGRAM')"
              class="w-5 h-5"
              :style="{ color: getSocialMediaColor(channel?.socialMedia || 'TELEGRAM') }"
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

      <!-- Project selector (edit mode only) -->
      <div v-if="isEditMode">
        <UFormField 
          :label="t('channel.project', 'Project')" 
          required
          :help="t('channel.projectHelp', 'You can move this channel to another project')"
        >
          <USelectMenu
            v-model="state.projectId"
            :items="projectOptions"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
      </div>

      <!-- Channel name -->
      <UFormField :label="t('channel.name')" required>
        <UInput
          v-model="state.name"
          :placeholder="t('channel.namePlaceholder')"
          class="w-full"
          size="lg"
        />
      </UFormField>

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

      <!-- Telegram credentials -->
      <div v-if="currentSocialMedia === 'TELEGRAM'" class="space-y-4">
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('channel.telegramCredentials', 'Telegram Credentials') }}
          </h3>
          
          <div class="space-y-4">
            <UFormField
              :label="t('channel.telegramChannelId', 'Channel ID')"
              :help="t('channel.telegramChannelIdHelp', 'Telegram channel ID (e.g., -1001234567890)')"
            >
              <UInput
                v-model="state.credentials.telegramChannelId"
                :placeholder="t('channel.telegramChannelIdPlaceholder', '-1001234567890')"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="t('channel.telegramBotToken', 'Bot Token')"
              :help="t('channel.telegramBotTokenHelp', 'Telegram bot token from @BotFather')"
            >
              <UInput
                v-model="state.credentials.telegramBotToken"
                type="password"
                :placeholder="t('channel.telegramBotTokenPlaceholder', '110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw')"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </div>

      <!-- VK credentials -->
      <div v-if="currentSocialMedia === 'VK'" class="space-y-4">
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('channel.vkCredentials', 'VK Credentials') }}
          </h3>
          
          <div class="space-y-4">
            <UFormField
              :label="t('channel.vkAccessToken', 'Access Token')"
              :help="t('channel.vkAccessTokenHelp', 'Service or user access token for VK API')"
            >
              <UInput
                v-model="state.credentials.vkAccessToken"
                type="password"
                :placeholder="t('channel.vkAccessTokenPlaceholder', 'vk1.a.abc...')"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </div>


      <div
        class="flex items-center justify-end gap-3 pt-6"
        :class="[hideHeader ? '' : 'border-t border-gray-200 dark:border-gray-700']"
      >
        <UButton
          v-if="!hideCancel"
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
          :disabled="!state.name || !state.channelIdentifier || !state.language"
        >
          {{ isEditMode ? t('common.save') : t('common.create') }}
        </UButton>
      </div>
    </form>
  </div>
</template>
