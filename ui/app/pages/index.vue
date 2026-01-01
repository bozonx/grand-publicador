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
  try {
    const data = await fetchProjects()
    if (!data || data.length === 0) return

    // Fetch posts from all user's projects
    const allPosts: PostWithRelations[] = []
    // Limit to first 3 projects to avoid too many requests
    const topProjects = projects.value.slice(0, 3)
    
    for (const project of topProjects) {
      try {
        const projectPosts = await fetchPostsByProject(project.id)
        if (projectPosts && Array.isArray(projectPosts)) {
          allPosts.push(...projectPosts.slice(0, 5))
        }
      } catch (e) {
        console.error(`Failed to fetch posts for project ${project.id}:`, e)
      }
    }

    // Sort by creation date and take top 5
    recentPosts.value = allPosts
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 5)
  } catch (err) {
    console.error('Dashboard initialization error:', err)
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
function truncateContent(content: string | null | undefined, maxLength = 100): string {
  if (!content) return ''
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

// Group projects by role: Owner > Admin > Editor > Viewer
const projectsByRole = computed(() => {
  const groups: Record<string, ProjectWithRole[]> = {}
  
  projects.value.forEach(p => {
    const role = p.role || 'viewer'
    if (!groups[role]) groups[role] = []
    groups[role].push(p)
  })

  const roleOrder = ['owner', 'admin', 'editor', 'viewer']
  return roleOrder
    .filter(role => groups[role] && groups[role].length > 0)
    .map(role => ({
      role,
      projects: groups[role]!.sort((a, b) => a.name.localeCompare(b.name))
    }))
})

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




    <!-- Content grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Left side: Projects and Recent Posts -->
      <div class="lg:col-span-2 space-y-6">
        <!-- My Projects -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div
            class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('project.titlePlural') }} ({{ totalProjects }})
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

            <!-- Project list grouped by role -->
            <div v-else class="space-y-6">
              <div v-for="group in projectsByRole" :key="group.role" class="space-y-3">
                <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
                  {{ t(`dashboard.group_${group.role}`) }}
                </h3>
                <div class="space-y-3">
                  <ProjectsProjectListItem
                    v-for="project in group.projects"
                    :key="project.id"
                    :project="project"
                    :show-description="false"
                  />
                </div>
              </div>
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
                        {{ t(`postStatus.${(post.status || 'draft').toLowerCase()}`) }}
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

      <!-- Right side: Channels -->
      <div class="lg:col-span-1">
        <ChannelsDashboardPanel />
      </div>
    </div>
  </div>
</template>
