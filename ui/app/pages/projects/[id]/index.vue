<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjects } from '~/composables/useProjects'

definePageMeta({
  middleware: 'auth',
})

const { t, d } = useI18n()
const router = useRouter()
const route = useRoute()

const {
  currentProject,
  isLoading,
  error,
  fetchProject,
  clearCurrentProject,
  canEdit,
  getRoleDisplayName,
} = useProjects()

const projectId = computed(() => route.params.id as string)

// Fetch project on mount
onMounted(async () => {
  if (projectId.value) {
    await fetchProject(projectId.value)
  }
})

// Clean up on unmount
onUnmounted(() => {
  clearCurrentProject()
})

/**
 * Navigate back to projects list
 */
function goBack() {
  router.push('/projects')
}

/**
 * Get role badge color based on role
 */
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
function getRoleBadgeColor(role: string | undefined): BadgeColor {
  const colors: Record<string, BadgeColor> = {
    owner: 'primary',
    admin: 'secondary',
    editor: 'info',
    viewer: 'neutral',
  }
  return colors[role || 'viewer'] || 'neutral'
}
</script>

<template>
  <div>
    <!-- Back button and breadcrumb -->
    <div class="mb-6">
      <UButton variant="ghost" color="neutral" icon="i-heroicons-arrow-left" @click="goBack">
        {{ t('common.back') }}
      </UButton>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <div class="flex items-center gap-3">
        <UIcon
          name="i-heroicons-exclamation-circle"
          class="w-5 h-5 text-red-600 dark:text-red-400"
        />
        <p class="text-red-700 dark:text-red-300">{{ error }}</p>
      </div>
      <div class="mt-4">
        <UButton variant="outline" color="neutral" @click="goBack">
          {{ t('common.back') }}
        </UButton>
      </div>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading && !currentProject" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3"
        />
        <p class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Project not found -->
    <div
      v-else-if="!currentProject"
      class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center"
    >
      <UIcon
        name="i-heroicons-document-magnifying-glass"
        class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('errors.notFound') }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        The project you're looking for doesn't exist or you don't have access to it.
      </p>
      <UButton @click="goBack">
        {{ t('common.back') }}
      </UButton>
    </div>

    <!-- View mode -->
    <div v-else>
      <!-- Page header -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {{ currentProject.name }}
                </h1>
                <UBadge :color="getRoleBadgeColor(currentProject.role)" variant="subtle">
                  {{ getRoleDisplayName(currentProject.role) }}
                </UBadge>
              </div>

              <p v-if="currentProject.description" class="text-gray-600 dark:text-gray-400 mb-4">
                {{ currentProject.description }}
              </p>

              <div
                class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400"
              >
                <span v-if="currentProject.owner" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-user" class="w-4 h-4" />
                  {{ t('project.owner') }}:
                  {{ currentProject.owner.fullName || currentProject.owner.telegramUsername || 'Unknown' }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-users" class="w-4 h-4" />
                  {{ t('project.members') }}: {{ currentProject.memberCount || 0 }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-signal" class="w-4 h-4" />
                  {{ t('channel.titlePlural') }}: {{ currentProject.channelCount || 0 }}
                </span>
                <span v-if="currentProject.lastPostAt" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                  {{ t('project.lastPost', 'Last post') }}:
                  {{ d(new Date(currentProject.lastPostAt), 'short') }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 ml-4">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-document-text"
                :to="`/projects/${currentProject.id}/posts`"
              >
                {{ t('post.titlePlural', 'Posts') }}
              </UButton>

              <UButton
                color="primary"
                icon="i-heroicons-plus"
                :to="`/projects/${currentProject.id}/posts/new`"
              >
                {{ t('common.create', 'Create') }}
              </UButton>

              <UButton
                v-if="canEdit(currentProject)"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-cog-6-tooth"
                :to="`/projects/${currentProject.id}/settings`"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- Channels Section -->
      <div id="channels-section" class="bg-white dark:bg-gray-800 rounded-lg shadow mt-6 p-6">
        <FeaturesChannelsList :project-id="currentProject.id" />
      </div>
    </div>
  </div>
</template>
