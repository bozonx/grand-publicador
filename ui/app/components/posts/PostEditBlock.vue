<script setup lang="ts">
import type { PostWithRelations } from '~/composables/usePosts'
import type { PublicationWithRelations } from '~/composables/usePublications'
import type { ChannelWithProject } from '~/composables/useChannels'
import { usePosts } from '~/composables/usePosts'
import SocialIcon from '~/components/common/SocialIcon.vue' // Ensure this path is correct

interface Props {
  post?: PostWithRelations
  publication?: PublicationWithRelations
  availableChannels?: ChannelWithProject[]
  isCreating?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['deleted', 'cancel', 'success'])

const { t } = useI18n()
const { updatePost, deletePost, createPost, isLoading } = usePosts()

const isCollapsed = ref(!props.isCreating)
const isDeleting = ref(false)
const showAdvancedFields = ref(false)


// Formatting date helper
const toDatetimeLocal = (dateStr?: string | null) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const formatPublishedAt = (dateStr?: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleString()
}

const safePost = computed(() => props.post || {} as Partial<PostWithRelations>)

// Initial state helpers
const hasTitle = !!safePost.value.title
const hasTags = !!safePost.value.tags
const hasScheduledAt = !!safePost.value.scheduledAt
const hasContent = !!safePost.value.content && safePost.value.content.length > 0

// Toggles for optional fields
// If creating, default showTitle/Content/Tags to true for better UX, or follow preference
const showTitle = ref(props.isCreating ? true : hasTitle)
const showContent = ref(props.isCreating ? true : hasContent)
const showTags = ref(props.isCreating ? true : hasTags)
const showScheduledAt = ref(hasScheduledAt)

// Form Data
const formData = reactive({
  channelId: '', 
  content: safePost.value.content || '',
  title: safePost.value.title || '',
  tags: safePost.value.tags || '',
  scheduledAt: toDatetimeLocal(safePost.value.scheduledAt),
  description: safePost.value.description || '',
  postDate: toDatetimeLocal(safePost.value.postDate),
  meta: safePost.value.meta || '{}',
  language: safePost.value.language || props.publication?.language || 'en-US',
  postType: safePost.value.postType || props.publication?.postType || 'POST',
})

const channelOptions = computed(() => {
    return props.availableChannels?.map(c => ({
        value: c.id,
        label: c.name,
        socialMedia: c.socialMedia,
        language: c.language
    })) || []
})

const selectedChannel = computed(() => {
    if (props.isCreating) {
        return props.availableChannels?.find(c => c.id === formData.channelId)
    }
    return props.post?.channel
})

// Watchers for creation channel selection
watch(() => formData.channelId, (newId) => {
    if (!props.isCreating || !newId || !props.availableChannels) return
    const channel = props.availableChannels.find(c => c.id === newId)
    if (channel) {
        formData.language = channel.language
    }
})

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function toggleAdvancedFields() {
  showAdvancedFields.value = !showAdvancedFields.value
}

async function handleSave() {
  if (props.isCreating) {
      if (!formData.channelId || !props.publication) return 

      const newPost = await createPost({
          channelId: formData.channelId,
          publicationId: props.publication.id,
          content: showContent.value ? formData.content : '',
          title: showTitle.value ? formData.title : undefined,
          tags: showTags.value ? formData.tags : undefined,
          postType: formData.postType as any,
          scheduledAt: showScheduledAt.value && formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined,
          language: formData.language,
          description: formData.description || undefined,
          postDate: formData.postDate ? new Date(formData.postDate).toISOString() : undefined,
          meta: formData.meta,
          status: 'DRAFT',
          socialMedia: selectedChannel.value?.socialMedia // createPost might need this or infer it
      })

      if (newPost) {
          emit('success', newPost)
      }

  } else {
      if (!props.post) return
      await updatePost(props.post.id, {
        content: showContent.value ? formData.content : '',
        title: showTitle.value ? formData.title : null,
        tags: showTags.value ? formData.tags : null,
        scheduledAt: showScheduledAt.value && formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : (showScheduledAt.value ? undefined : null), 
        description: formData.description || null,
        postDate: formData.postDate ? new Date(formData.postDate).toISOString() : null,
        meta: formData.meta,
      })
      emit('success')
  }
}

const isDeleteModalOpen = ref(false)

async function handleDelete() {
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!props.post) return
  isDeleting.value = true
  const success = await deletePost(props.post.id)
  isDeleting.value = false
  isDeleteModalOpen.value = false
  
  if (success) {
    emit('deleted', props.post.id)
  }
}

// Watchers for external updates (only if editing)
watch(() => props.post, (newPost) => {
    if (!newPost) return
    formData.content = newPost.content || ''
    formData.title = newPost.title || ''
    formData.tags = newPost.tags || ''
    formData.scheduledAt = toDatetimeLocal(newPost.scheduledAt)
    formData.description = newPost.description || ''
    formData.postDate = toDatetimeLocal(newPost.postDate)
    formData.meta = newPost.meta || '{}'
    
    // Update visibility if new data comes in and has value
    if (newPost.title) showTitle.value = true
    if (newPost.content) showContent.value = true
    if (newPost.tags) showTags.value = true
    if (newPost.scheduledAt) showScheduledAt.value = true
}, { deep: true })

onMounted(() => {
    if (props.isCreating) {
         if (props.availableChannels?.length === 1) {
            formData.channelId = props.availableChannels[0].id
        }
    } else if (props.post) {
        formData.scheduledAt = toDatetimeLocal(props.post.scheduledAt)
        formData.postDate = toDatetimeLocal(props.post.postDate)
    }
})

// Validation for creation
const isValid = computed(() => {
    if (props.isCreating) return !!formData.channelId
    return true
})
</script>

<template>
  <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800/50 overflow-hidden mb-4 shadow-sm"
       :class="{ 'ring-2 ring-primary-500/20': isCreating }">
    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6"></UIcon>
            <h3 class="text-lg font-medium">
              {{ t('post.deleteConfirm') }}
            </h3>
          </div>

          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ t('archive.delete_permanent_warning') }}
          </p>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :label="t('common.cancel')"
              @click="isDeleteModalOpen = false"
            ></UButton>
            <UButton
              color="error"
              :label="t('common.delete')"
              :loading="isDeleting"
              @click="confirmDelete"
            ></UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Header -->
    <div 
      class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors select-none"
      @click="toggleCollapse"
    >
      <div class="flex items-center gap-3 overflow-hidden">
        <!-- Icon -->
        <SocialIcon 
          v-if="selectedChannel?.socialMedia" 
          :platform="selectedChannel.socialMedia" 
          class="shrink-0"
        />
        <UIcon v-else-if="isCreating" name="i-heroicons-plus-circle" class="w-5 h-5 text-primary-500" />
        <UIcon v-else name="i-heroicons-document-text" class="w-5 h-5 text-gray-400" />
        
        <!-- Channel Name or Title -->
        <span class="font-medium text-gray-900 dark:text-white truncate">
          <template v-if="isCreating">
              {{ t('post.createPost', 'Create Post') }}
          </template>
          <template v-else>
              {{ props.post?.channel?.name || t('common.unknownChannel') }}
          </template>
        </span>

        <!-- Language Code -->
        <UBadge 
          v-if="!isCreating && props.post?.language" 
          variant="subtle" 
          color="neutral" 
          size="xs"
          class="ml-1 font-mono shrink-0 rounded-md"
        >
          {{ props.post.language }}
        </UBadge>

        <!-- Published At Display -->
        <span v-if="!isCreating && props.post?.publishedAt" class="text-xs text-gray-500 flex items-center gap-1">
             <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5 text-green-500" />
             {{ formatPublishedAt(props.post.publishedAt) }}
        </span>
      </div>

      <!-- Expand/Collapse Button -->
      <div class="flex items-center gap-2">
           <span v-if="isCollapsed && !isCreating" class="text-xs text-gray-500 hidden sm:flex gap-1">
               <UIcon v-if="props.post?.scheduledAt" name="i-heroicons-clock" class="w-4 h-4" />
           </span>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            :icon="isCollapsed ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-up'"
            class="ml-2"
          />
      </div>
    </div>

    <!-- Collapsible Content -->
    <div v-show="!isCollapsed" class="border-t border-gray-200 dark:border-gray-700/50 p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
       
       <!-- Channel Selector (Only if Creating) -->
       <div v-if="isCreating" class="space-y-1">
           <div class="flex items-center gap-1 mb-1">
               <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t('post.selectChannel', 'Select Channel') }}</span>
               <span class="text-red-500">*</span>
           </div>
           <USelectMenu
                v-model="formData.channelId"
                :items="channelOptions"
                value-key="value"
                label-key="label"
                class="w-full"
                :placeholder="t('post.selectChannel', 'Select a channel...')"
            >
                <template #option="{ option }">
                    <div class="flex items-center gap-2 w-full">
                        <SocialIcon :platform="option.socialMedia" size="xs" />
                        <span class="truncate">{{ option.label }}</span>
                        <span class="ml-auto text-xs text-gray-500 uppercase">{{ option.language }}</span>
                    </div>
                </template>
            </USelectMenu>
       </div>

       <!-- Content Fields with Checkboxes -->
       
       <!-- Title -->
       <div class="space-y-2">
             <UCheckbox v-model="showTitle" :label="t('post.postTitle')" :ui="{ label: 'font-medium text-gray-700 dark:text-gray-200' }" />
             <div v-if="showTitle" class="pl-6 animate-fade-in">
                <UInput v-model="formData.title" :placeholder="t('post.titlePlaceholder')" class="w-full" />
             </div>
       </div>

       <!-- Content -->
       <div class="space-y-2">
             <UCheckbox v-model="showContent" :label="t('post.content')" required :ui="{ label: 'font-medium text-gray-700 dark:text-gray-200' }" />
             <div v-if="showContent" class="pl-6 animate-fade-in"> 
                <EditorTiptapEditor
                  v-model="formData.content"
                  :placeholder="t('post.contentPlaceholder')"
                  :min-height="200"
                />
             </div>
       </div>

        <!-- Tags -->
        <div class="space-y-2">
            <UCheckbox v-model="showTags" :label="t('post.tags')" :ui="{ label: 'font-medium text-gray-700 dark:text-gray-200' }" />
            <div v-if="showTags" class="pl-6 animate-fade-in">
                 <UInput v-model="formData.tags" :placeholder="t('post.tagsPlaceholder')" icon="i-heroicons-hashtag" />
            </div>
        </div>

        <!-- Scheduled At -->
        <div v-if="!safePost.publishedAt" class="space-y-2">
            <UCheckbox v-model="showScheduledAt" :label="t('post.scheduledAt')" :ui="{ label: 'font-medium text-gray-700 dark:text-gray-200' }" />
            <div v-if="showScheduledAt" class="pl-6 animate-fade-in">
                 <UInput v-model="formData.scheduledAt" type="datetime-local" icon="i-heroicons-clock" />
            </div>
        </div>

       <!-- Advanced fields toggle -->
      <div class="flex justify-center pt-2">
        <UButton
          variant="outline"
          color="neutral"
          size="sm"
          :icon="showAdvancedFields ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="rounded-full"
          @click="toggleAdvancedFields"
        >
          {{
            showAdvancedFields
              ? t('post.hideAdvanced', 'Hide advanced options')
              : t('post.showAdvanced', 'Show advanced options')
          }}
        </UButton>
      </div>

       <!-- Advanced fields -->
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="showAdvancedFields"
          class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700/50"
        >
             <!-- Post Date -->
          <UFormField label="Post Date" help="Date of the article (optional)">
            <UInput v-model="formData.postDate" type="datetime-local" class="w-full" icon="i-heroicons-calendar" />
          </UFormField>

          <!-- Description -->
          <UFormField label="Description" help="Short description">
             <UTextarea v-model="formData.description" :rows="3" />
          </UFormField>

          <!-- Meta -->
          <UFormField label="Meta (JSON)" help="Additional metadata in JSON format">
             <UTextarea v-model="formData.meta" :rows="4" font-family="mono" />
          </UFormField>
        </div>
      </Transition>

      <!-- Actions -->
      <div class="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700/50 mt-4">
        <!-- Delete Button (Only if NOT creating) -->
        <UButton
          v-if="!isCreating"
          color="error"
          variant="ghost"
          :loading="isDeleting"
          icon="i-heroicons-trash"
          @click="handleDelete"
        >
          {{ t('common.delete') }}
        </UButton>

        <!-- Cancel Content (If Creating, show Cancel button on left for symmetry or just right? PostCreate had it on right. PostEdit doesn't have cancel except to collapse. User removed Cancel from PublicationForm. Let's put Cancel on right for Create) -->
         <UButton
          v-if="isCreating"
          color="neutral"
          variant="ghost"
          @click="emit('cancel')"
        >
          {{ t('common.cancel') }}
        </UButton>
        <div v-else></div> <!-- Spacer -->

        <UButton
          color="primary"
          :loading="isLoading"
          :disabled="!isValid"
          @click="handleSave"
        >
          {{ isCreating ? t('common.create') : t('common.save') }}
        </UButton>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
