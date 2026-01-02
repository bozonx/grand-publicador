<script setup lang="ts">
import type { ProjectWithRole } from '~/stores/projects'
import { getRoleBadgeColor } from '~/utils/roles'

const props = defineProps<{
  project: ProjectWithRole
  showDescription?: boolean
}>()

const { t, d } = useI18n()
const router = useRouter()

function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return d(new Date(date), 'short')
}

function formatDateWithTime(date: string | null | undefined): string {
  if (!date) return '-'
  return d(new Date(date), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <NuxtLink
    :to="`/projects/${project.id}`"
    class="block app-card app-card-hover transition-all cursor-pointer"
    :class="{ 'opacity-75 grayscale': project.archivedAt }"
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
              <UIcon name="i-heroicons-signal" class="w-4 h-4 shrink-0" />
              <span>
                {{ project.channelCount || 0 }} {{ t('channel.titlePlural').toLowerCase() }}
              </span>
            </div>
            
            <div class="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>

            <div class="flex items-center gap-1.5" :title="t('publication.titlePlural')">
              <UIcon name="i-heroicons-document-text" class="w-4 h-4 shrink-0" />
              <span>
                {{ project.publicationsCount || 0 }} {{ t('publication.titlePlural').toLowerCase() }}
              </span>
            </div>

            <template v-if="project.languages?.length">
              <div class="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div class="flex items-center gap-1.5">
                <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 shrink-0" />
                <span class="uppercase">
                  {{ project.languages.map(l => l.split('-')[0]).join(', ') }}
                </span>
              </div>
            </template>

            <template v-if="project.lastPublicationAt">
              <div class="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>

              <div class="flex items-center gap-1.5">
                <UIcon name="i-heroicons-clock" class="w-4 h-4 shrink-0" />
                <span>
                   {{ t('project.lastPublication') }}:
                   <span 
                     class="text-primary-500 hover:text-primary-400 transition-colors cursor-pointer font-medium underline decoration-dotted decoration-primary-500/30 underline-offset-2"
                     @click.stop.prevent="router.push(`/projects/${project.id}/publications/${project.lastPublicationId}`)"
                   >
                     {{ formatDateWithTime(project.lastPublicationAt) }}
                   </span>
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
