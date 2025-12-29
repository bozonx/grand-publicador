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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const form = ref<{ node: any } | null>(null)

const isEditMode = computed(() => !!props.channel?.id)

/**
 * Form submission handler
 */
async function handleSubmit(data: Record<string, unknown>) {
  if (isEditMode.value && props.channel) {
    // Update existing channel
    const updateData: ChannelUpdateInput = {
      name: data.name as string,
      channelIdentifier: data.channel_identifier as string,
      isActive: data.is_active as boolean,
    }

    const result = await updateChannel(props.channel.id, updateData)
    if (result) {
      emit('success')
    }
  } else {
    // Create new channel
    const result = await createChannel({
      projectId: props.projectId,
      name: data.name as string,
      socialMedia: data.social_media as SocialMediaEnum,
      channelIdentifier: data.channel_identifier as string,
      isActive: data.is_active as boolean,
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
 * Programmatically submit the form
 */
function submitForm() {
  form.value?.node.submit()
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

// Selected social media for dynamic placeholder
const selectedSocialMedia = ref<SocialMediaEnum | undefined>(props.channel?.socialMedia)

// Watch for changes in form to update placeholder
function onSocialMediaChange(value: string | undefined) {
  if (value) {
    selectedSocialMedia.value = value as SocialMediaEnum
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ isEditMode ? t('channel.editChannel') : t('channel.createChannel') }}
      </h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ isEditMode ? t('channel.editDescription') : t('channel.createDescription') }}
      </p>
    </div>

    <FormKit ref="form" type="form" :actions="false" @submit="handleSubmit">
      <div class="space-y-6">
        <!-- Channel name -->
        <FormKit
          type="text"
          name="name"
          :label="t('channel.name')"
          :placeholder="t('channel.namePlaceholder')"
          :value="channel?.name || ''"
          validation="required|length:2,100"
          :validation-messages="{
            required: t('validation.required'),
            length:
              t('validation.minLength', { min: 2 }) +
              ' / ' +
              t('validation.maxLength', { max: 100 }),
          }"
        />

        <!-- Social media type (only for create mode) -->
        <div v-if="!isEditMode">
          <FormKit
            type="select"
            name="social_media"
            :label="t('channel.socialMedia')"
            :options="
              socialMediaOptions.map((opt: { label: string; value: string }) => ({
                label: opt.label,
                value: opt.value,
              }))
            "
            :value="channel?.socialMedia || 'telegram'"
            validation="required"
            :validation-messages="{
              required: t('validation.required'),
            }"
            @input="onSocialMediaChange"
          />

          <!-- Social media preview -->
          <div
            v-if="selectedSocialMedia"
            class="mt-2 flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
          >
            <div
              class="p-1.5 rounded"
              :style="{ backgroundColor: getSocialMediaColor(selectedSocialMedia) + '20' }"
            >
              <UIcon
                :name="getSocialMediaIcon(selectedSocialMedia)"
                class="w-4 h-4"
                :style="{ color: getSocialMediaColor(selectedSocialMedia) }"
              />
            </div>
            <span class="text-sm text-gray-600 dark:text-gray-300">
              {{
                socialMediaOptions.find((o: { value: string }) => o.value === selectedSocialMedia)
                  ?.label
              }}
            </span>
          </div>
        </div>

        <!-- Display current social media for edit mode -->
        <div v-else class="space-y-1">
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
              {{
                socialMediaOptions.find((o: { value: string }) => o.value === channel?.socialMedia)
                  ?.label
              }}
            </span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('channel.socialMediaCannotChange') }}
          </p>
        </div>

        <!-- Channel identifier -->
        <FormKit
          type="text"
          name="channel_identifier"
          :label="t('channel.identifier')"
          :placeholder="
            getIdentifierPlaceholder(isEditMode ? channel?.socialMedia : selectedSocialMedia)
          "
          :value="channel?.channelIdentifier || ''"
          validation="required|length:1,500"
          :validation-messages="{
            required: t('validation.required'),
            length:
              t('validation.minLength', { min: 1 }) +
              ' / ' +
              t('validation.maxLength', { max: 500 }),
          }"
          :help="getIdentifierHelp(isEditMode ? channel?.socialMedia : selectedSocialMedia)"
        />

        <!-- Active status -->
        <FormKit
          type="checkbox"
          name="is_active"
          :label="t('channel.isActive')"
          :value="channel?.isActive ?? true"
          :help="t('channel.isActiveHelp')"
          decorator-icon="check"
        />

        <!-- Form actions -->
        <div
          class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
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
          <UButton type="button" color="primary" :loading="isLoading" @click="submitForm">
            {{ isEditMode ? t('common.save') : t('common.create') }}
          </UButton>
        </div>
      </div>
    </FormKit>
  </div>
</template>
