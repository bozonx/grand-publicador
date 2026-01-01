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
      <div class="flex items-center justify-between gap-6">
        <div class="flex-1 min-w-0">
          <!-- Project Title -->
          <h3 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
            {{ project.name }}
          </h3>

          <!-- Description (optional) -->
          <p 
            v-if="showDescription && project.description" 
            class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2"
          >
            {{ project.description }}
          </p>

          <!-- Warning: 3+ days without posts -->
          <div v-if="isWarningActive" class="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md w-fit border border-amber-100/50 dark:border-amber-800/30">
             <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 shrink-0" />
             <span class="truncate">
                {{ t('project.noRecentPostsWarning') }}
             </span>
          </div>
        </div>

        <!-- Right Side: Publications Count -->
        <div class="shrink-0">
          <UBadge 
            color="neutral" 
            variant="soft" 
            size="lg"
            class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm"
          >
            <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <span class="font-black text-base text-gray-700 dark:text-gray-200">{{ project.publicationsCount || 0 }}</span>
          </UBadge>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
