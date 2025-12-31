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
</script>

<template>
  <NuxtLink
    :to="`/projects/${project.id}`"
    class="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-100 dark:border-gray-700"
  >
    <div class="p-4 sm:p-5">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <!-- Header: Name + Role -->
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate max-w-full">
              {{ project.name }}
            </h3>
            <UBadge 
              v-if="project.role" 
              :color="getRoleBadgeColor(project.role)" 
              variant="subtle" 
              size="xs"
              class="capitalize"
            >
              {{ t(`roles.${project.role}`) }}
            </UBadge>
          </div>

          <!-- Description (optional) -->
          <p 
            v-if="showDescription && project.description" 
            class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2"
          >
            {{ project.description }}
          </p>

          <!-- Metrics / Stats -->
          <div class="flex items-center gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 flex-wrap">
            <div class="flex items-center gap-1.5" :title="t('channel.titlePlural')">
              <UIcon name="i-heroicons-signal" class="w-4 h-4 flex-shrink-0" />
              <span>
                {{ project.channelCount || 0 }} {{ t('channel.titlePlural').toLowerCase() }}
              </span>
            </div>
            
            <div class="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>

            <div class="flex items-center gap-1.5" :title="t('post.titlePlural')">
              <UIcon name="i-heroicons-document-text" class="w-4 h-4 flex-shrink-0" />
              <span>
                {{ project.postCount || 0 }} {{ t('post.titlePlural').toLowerCase() }}
              </span>
            </div>
          </div>

          <!-- Last Post Date -->
          <div v-if="project.lastPostAt" class="mt-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
             <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 flex-shrink-0" />
             <span>
                {{ t('common.lastPost') }}: {{ formatDate(project.lastPostAt) }}
             </span>
          </div>
        </div>

        <!-- Owner Avatar (optional visual cue) -->
        <!-- Currently omitted to save space as requested layout didn't emphasize it, but we show role -->
      </div>
    </div>
  </NuxtLink>
</template>
