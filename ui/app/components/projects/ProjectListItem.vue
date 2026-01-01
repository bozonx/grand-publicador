<script setup lang="ts">
import type { ProjectWithRole } from '~/stores/projects'

const props = defineProps<{
  project: ProjectWithRole
  showDescription?: boolean
}>()

const { t } = useI18n()

// Role badge color mapping
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

function getRoleBadgeColor(role: string | undefined | null): BadgeColor {
  if (!role) return 'neutral'
  const colors: Record<string, BadgeColor> = {
    owner: 'primary',
    admin: 'secondary',
    editor: 'info',
    viewer: 'neutral',
  }
  return colors[role.toLowerCase()] || 'neutral'
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

// Warning if no new posts for more than 3 days
const isWarningActive = computed(() => {
  if (!props.project.lastPublicationAt) return true // No posts ever is also a warning
  
  const lastDate = new Date(props.project.lastPublicationAt).getTime()
  const now = new Date().getTime()
  const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24)
  
  return diffDays > 3
})
</script>

<template>
  <NuxtLink
    :to="`/projects/${project.id}`"
    class="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-100 dark:border-gray-700"
    :class="{ 'opacity-75 grayscale-[0.5]': project.archivedAt }"
  >
    <div class="p-4 sm:p-5">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <!-- Header: Name + Role -->
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              {{ project.name }}
            </h3>
            <div class="flex items-center gap-1.5">
              <UBadge 
                color="neutral" 
                variant="subtle" 
                size="xs"
                class="flex items-center gap-1"
              >
                <UIcon name="i-heroicons-document-text" class="w-3 h-3" />
                {{ project.publicationsCount || 0 }}
              </UBadge>
            </div>
          </div>

          <!-- Description (optional) -->
          <p 
            v-if="showDescription && project.description" 
            class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2"
          >
            {{ project.description }}
          </p>

          <!-- Warning -->
          <div v-if="isWarningActive" class="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
             <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 shrink-0" />
             <span class="truncate">
                {{ t('project.noRecentPostsWarning') }}
             </span>
          </div>


        </div>

        <!-- Owner Avatar (optional visual cue) -->
        <!-- Currently omitted to save space as requested layout didn't emphasize it, but we show role -->
      </div>
    </div>
  </NuxtLink>
</template>
