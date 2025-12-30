<script setup lang="ts">
import { useProjects } from '~/composables/useProjects'
import type { ProjectWithRole } from '~/stores/projects'
import type { PostWithRelations } from '~/composables/usePosts'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const { displayName } = useAuth()

const { projects, fetchProjects, isLoading: projectsLoading } = useProjects()
const { fetchPostsByProject, isLoading: postsLoading } = usePosts()

// State
const recentPosts = ref<PostWithRelations[]>([])
const isLoading = computed(() => projectsLoading.value || postsLoading.value)

// Fetch data on mount
onMounted(async () => {
  await fetchProjects()

  // Fetch posts from all user's projects
  if (projects.value.length > 0) {
    const allPosts: PostWithRelations[] = []
    for (const project of projects.value.slice(0, 3)) {
      // Limit to first 3 projects
      const projectPosts = await fetchPostsByProject(project.id)
      allPosts.push(...projectPosts.slice(0, 5)) // Limit posts per project
    }
    // Sort by creation date and take top 5
    recentPosts.value = allPosts
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
  }
})

/**
 * Format date for display
 */
function formatDate(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

/**
 * Truncate content for preview
 */
function truncateContent(content: string, maxLength = 100): string {
  const text = content.replace(/<[^>]*>/g, '').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Get status color
 */
function getStatusColor(status: string | null): 'success' | 'warning' | 'error' | 'neutral' {
  const colors: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    draft: 'neutral',
    scheduled: 'warning',
    published: 'success',
    failed: 'error',
  }
  return status ? colors[status] || 'neutral' : 'neutral'
}

// Quick stats
const totalProjects = computed(() => projects.value.length)
const totalChannels = computed(() =>
  projects.value.reduce((sum: number, project: ProjectWithRole) => sum + (project.channelCount || 0), 0)
)
const totalPosts = computed(() =>
  projects.value.reduce((sum: number, project: ProjectWithRole) => sum + (project.postCount || 0), 0)
)
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('dashboard.welcome') }}, {{ displayName }}!
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ t('dashboard.title') }}
      </p>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <!-- Projects stat -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('project.titlePlural') }}
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {{ totalProjects }}
            </p>
          </div>
          <div class="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <UIcon
              name="i-heroicons-briefcase"
              class="w-6 h-6 text-primary-600 dark:text-primary-400"
            />
          </div>
        </div>
      </div>

      <!-- Channels stat -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('channel.titlePlural') }}
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {{ totalChannels }}
            </p>
          </div>
          <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <UIcon name="i-heroicons-signal" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      <!-- Posts stat -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('post.titlePlural') }}
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {{ totalPosts }}
            </p>
          </div>
          <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <UIcon
              name="i-heroicons-document-text"
              class="w-6 h-6 text-green-600 dark:text-green-400"
            />
          </div>
        </div>
      </div>
    </div>


    <!-- Content grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- My Projects -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('project.titlePlural') }}
          </h2>
          <UButton variant="ghost" color="primary" size="sm" to="/projects">
            {{ t('common.viewAll') }}
          </UButton>
        </div>
        <div class="p-6">
          <!-- Loading -->
          <div v-if="isLoading && projects.length === 0" class="flex items-center justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-gray-400 animate-spin" />
          </div>

          <!-- Empty state -->
          <div v-else-if="projects.length === 0" class="text-center py-8">
            <UIcon
              name="i-heroicons-briefcase"
              class="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-3"
            />
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              {{ t('project.noProjectsDescription') }}
            </p>
            <UButton icon="i-heroicons-plus" size="sm" to="/projects/new">
              {{ t('project.createProject') }}
            </UButton>
          </div>

          <!-- Project list -->
          <div v-else class="space-y-3">
            <NuxtLink
              v-for="project in projects.slice(0, 5)"
              :key="project.id"
              :to="`/projects/${project.id}`"
              class="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="min-w-0">
                  <h3 class="font-medium text-gray-900 dark:text-white truncate">
                    {{ project.name }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ project.channelCount || 0 }} {{ t('channel.titlePlural').toLowerCase() }} ·
                    {{ project.postCount || 0 }} {{ t('post.titlePlural').toLowerCase() }}
                  </p>
                </div>
                <UBadge v-if="project.role" color="primary" variant="subtle" size="xs">
                  {{ t(`roles.${project.role}`) }}
                </UBadge>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Recent Posts -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('dashboard.recentPosts') }}
          </h2>
        </div>
        <div class="p-6">
          <!-- Loading -->
          <div
            v-if="isLoading && recentPosts.length === 0"
            class="flex items-center justify-center py-8"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-gray-400 animate-spin" />
          </div>

          <!-- Empty state -->
          <div v-else-if="recentPosts.length === 0" class="text-center py-8">
            <UIcon
              name="i-heroicons-document-text"
              class="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-3"
            />
            <p class="text-gray-500 dark:text-gray-400">
              {{ t('post.noPostsDescription') }}
            </p>
          </div>

          <!-- Posts list -->
          <div v-else class="space-y-3">
            <NuxtLink
              v-for="post in recentPosts"
              :key="post.id"
              :to="`/projects/${post.channel?.projectId}/posts/${post.id}`"
              class="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-medium text-gray-900 dark:text-white truncate">
                      {{ post.title || t('post.untitled') }}
                    </h3>
                    <UBadge :color="getStatusColor(post.status)" size="xs" variant="subtle">
                      {{ t(`postStatus.${post.status || 'draft'}`) }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                    {{ truncateContent(post.content) }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {{ post.channel?.name }} · {{ formatDate(post.createdAt) }}
                  </p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
