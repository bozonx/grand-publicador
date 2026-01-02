<script setup lang="ts">
import type { PostWithRelations } from '~/composables/usePosts'
import { usePosts } from '~/composables/usePosts'
import SocialIcon from '~/components/common/SocialIcon.vue'

interface Props {
  post: PostWithRelations
}

const props = defineProps<Props>()
const emit = defineEmits(['deleted'])

const { t } = useI18n()
const { updatePost, deletePost, isLoading } = usePosts()

const isCollapsed = ref(true)
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

// Initial state helpers
const hasTitle = !!props.post.title
const hasTags = !!props.post.tags
const hasScheduledAt = !!props.post.scheduledAt
const hasContent = !!props.post.content && props.post.content.length > 0

// Toggles for optional fields
const showTitle = ref(hasTitle)
const showContent = ref(hasContent)
const showTags = ref(hasTags)
const showScheduledAt = ref(hasScheduledAt)

// Form Data
const formData = reactive({
  content: props.post.content || '',
  title: props.post.title || '',
  tags: props.post.tags || '',
  scheduledAt: toDatetimeLocal(props.post.scheduledAt),
  description: props.post.description || '',
  postDate: toDatetimeLocal(props.post.postDate),
  meta: props.post.meta || '{}',
})

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function toggleAdvancedFields() {
  showAdvancedFields.value = !showAdvancedFields.value
}

async function handleSave() {
  await updatePost(props.post.id, {
    content: showContent.value ? formData.content : '',
    title: showTitle.value ? formData.title : null,
    tags: showTags.value ? formData.tags : null,
    scheduledAt: showScheduledAt.value && formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : (showScheduledAt.value ? undefined : null), 
    description: formData.description || null,
    postDate: formData.postDate ? new Date(formData.postDate).toISOString() : null,
    meta: formData.meta,
  })
}

async function handleDelete() {
  if (!confirm(t('post.deleteConfirm'))) return
  
  isDeleting.value = true
  const success = await deletePost(props.post.id)
  isDeleting.value = false
  
  if (success) {
    emit('deleted', props.post.id)
  }
}

// Watchers
watch(() => props.post, (newPost) => {
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
    formData.scheduledAt = toDatetimeLocal(props.post.scheduledAt)
    formData.postDate = toDatetimeLocal(props.post.postDate)
})
</script>

<template>
  <div class="border border-gray-200 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800/50 overflow-hidden mb-4 shadow-sm">
    <!-- Header -->
    <div 
      class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors select-none"
      @click="toggleCollapse"
    >
      <div class="flex items-center gap-3 overflow-hidden">
        <!-- Icon -->
        <SocialIcon 
          v-if="post.channel?.socialMedia" 
          :platform="post.channel.socialMedia" 
          class="shrink-0"
        />
        <UIcon v-else name="i-heroicons-document-text" class="w-5 h-5 text-gray-400" />
        
        <!-- Channel Name -->
        <span class="font-medium text-gray-900 dark:text-white truncate">
          {{ post.channel?.name || t('common.unknownChannel') }}
        </span>

        <!-- Language Code -->
        <UBadge 
          v-if="post.language" 
          variant="subtle" 
          color="neutral" 
          size="xs"
          class="ml-1 font-mono shrink-0 rounded-md"
        >
          {{ post.language }}
        </UBadge>

        <!-- Published At Display -->
        <span v-if="post.publishedAt" class="text-xs text-gray-500 flex items-center gap-1">
             <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5 text-green-500" />
             {{ formatPublishedAt(post.publishedAt) }}
        </span>
      </div>

      <!-- Expand/Collapse Button -->
      <div class="flex items-center gap-2">
           <span v-if="isCollapsed" class="text-xs text-gray-500 hidden sm:flex gap-1">
               <UIcon v-if="post.scheduledAt" name="i-heroicons-clock" class="w-4 h-4" />
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
             <UCheckbox v-model="showContent" :label="t('post.content')" :ui="{ label: 'font-medium text-gray-700 dark:text-gray-200' }" />
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
        <div class="space-y-2">
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
        <UButton
          color="error"
          variant="ghost"
          :loading="isDeleting"
          icon="i-heroicons-trash"
          @click="handleDelete"
        >
          {{ t('common.delete') }}
        </UButton>

        <UButton
          color="primary"
          :loading="isLoading"
          @click="handleSave"
        >
          {{ t('common.save') }}
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
