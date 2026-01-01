<script setup lang="ts">
import type { ProjectWithRole } from '~/stores/projects'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const router = useRouter()
const { projects, isLoading, error, fetchProjects, fetchArchivedProjects, canEdit, canDelete } =
  useProjects()

const archivedProjects = ref<ProjectWithRole[]>([])
const showArchived = ref(false)
const isLoadingArchived = ref(false)

// Fetch active projects on mount
onMounted(() => {
  fetchProjects(false)
})

/**
 * Toggle archived projects visibility
 */
async function toggleArchivedProjects() {
  showArchived.value = !showArchived.value
  
  if (showArchived.value && archivedProjects.value.length === 0) {
    isLoadingArchived.value = true
    archivedProjects.value = await fetchArchivedProjects()
    isLoadingArchived.value = false
  }
}

/**
 * Navigate to create project page
 */
function goToCreateProject() {
  router.push('/projects/new')
}

/**
 * Navigate to edit project page
 */
function goToEditProject(projectId: string) {
  router.push(`/projects/${projectId}?edit=true`)
}

// Sorting
interface SortOption {
  id: string
  label: string
  icon: string
}

const sortOptions = computed<SortOption[]>(() => [
  { id: 'alphabetical', label: t('project.sort.alphabetical'), icon: 'i-heroicons-bars-3-bottom-left' },
  { id: 'role', label: t('project.sort.role'), icon: 'i-heroicons-user-circle' },
  { id: 'publicationsCount', label: t('project.sort.publicationsCount'), icon: 'i-heroicons-document-text' },
  { id: 'lastPublication', label: t('project.sort.lastPublication'), icon: 'i-heroicons-calendar' }
])

const sortBy = ref<SortOption>(sortOptions.value[0]!)
const sortOrder = ref<'asc' | 'desc'>('asc')

const roleWeights: Record<string, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1
}

function sortProjects(list: ProjectWithRole[]) {
  return [...list].sort((a, b) => {
    let result = 0
    if (sortBy.value.id === 'alphabetical') {
      result = a.name.localeCompare(b.name)
    } else if (sortBy.value.id === 'role') {
      const weightA = roleWeights[a.role || 'viewer'] || 0
      const weightB = roleWeights[b.role || 'viewer'] || 0
      result = weightB - weightA
    } else if (sortBy.value.id === 'publicationsCount') {
      result = (a.publicationsCount || 0) - (b.publicationsCount || 0)
    } else if (sortBy.value.id === 'lastPublication') {
      const dateA = a.lastPublicationAt ? new Date(a.lastPublicationAt).getTime() : 0
      const dateB = b.lastPublicationAt ? new Date(b.lastPublicationAt).getTime() : 0
      result = dateA - dateB
    }

    return sortOrder.value === 'asc' ? result : -result
  })
}

const sortedProjects = computed(() => sortProjects(projects.value))
const sortedArchivedProjects = computed(() => sortProjects(archivedProjects.value))


</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('project.titlePlural') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('project.myProjects') }}
        </p>
      </div>
      <div class="flex items-center gap-4">
        <UButton icon="i-heroicons-plus" @click="goToCreateProject">
            {{ t('project.createProject') }}
        </UButton>
      </div>
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
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && projects.length === 0" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3"
        />
        <p class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Projects list -->
    <div v-else-if="projects.length > 0" class="space-y-4">
      <!-- Sorting toolbar -->
      <div class="flex items-center justify-end gap-2 mb-4">
        <USelectMenu
          v-model="sortBy"
          :options="sortOptions"
          class="w-56"
        >
          <template #leading>
            <UIcon :name="sortBy.icon" class="w-4 h-4" />
          </template>
        </USelectMenu>
        <UButton
          :icon="sortOrder === 'asc' ? 'i-heroicons-bars-arrow-up' : 'i-heroicons-bars-arrow-down'"
          variant="ghost"
          color="neutral"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          :title="sortOrder === 'asc' ? t('common.sortOrder.asc') : t('common.sortOrder.desc')"
        />
      </div>

      <ProjectsProjectListItem
        v-for="project in sortedProjects"
        :key="project.id"
        :project="project"
        :show-description="true"
      />
      
      <!-- Show/Hide Archived Button -->
      <div class="flex justify-center pt-4">
        <UButton
          :icon="showArchived ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          variant="ghost"
          color="neutral"
          @click="toggleArchivedProjects"
          :loading="isLoadingArchived"
        >
          {{ showArchived ? 'Скрыть архивные' : 'Показать архивные' }}
        </UButton>
      </div>

      <!-- Archived Projects Section -->
      <div v-if="showArchived" class="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div v-if="archivedProjects.length > 0">
          <ProjectsProjectListItem
            v-for="project in sortedArchivedProjects"
            :key="project.id"
            :project="project"
            :show-description="true"
          />
        </div>
        <div v-else class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">Нет архивных проектов</p>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
      <UIcon
        name="i-heroicons-briefcase"
        class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('project.noProjectsFound') }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        Create your first project to start managing your social media content.
      </p>
      <UButton icon="i-heroicons-plus" @click="goToCreateProject">
        {{ t('project.createProject') }}
      </UButton>
    </div>


  </div>
</template>
