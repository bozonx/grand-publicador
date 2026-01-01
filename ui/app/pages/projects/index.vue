<script setup lang="ts">
import type { ProjectWithRole } from '~/stores/projects'
import { useSorting } from '~/composables/useSorting'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const router = useRouter()
const { projects, isLoading, error, fetchProjects, fetchArchivedProjects } = useProjects()

const archivedProjects = ref<ProjectWithRole[]>([])
const showArchived = ref(false)
const isLoadingArchived = ref(false)

// Sorting
const roleWeights: Record<string, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1
}

const sortOptions = computed(() => [
  { id: 'alphabetical', label: t('project.sort.alphabetical'), icon: 'i-heroicons-bars-3-bottom-left' },
  { id: 'role', label: t('project.sort.role'), icon: 'i-heroicons-user-circle' },
  { id: 'publicationsCount', label: t('project.sort.publicationsCount'), icon: 'i-heroicons-document-text' },
  { id: 'lastPublication', label: t('project.sort.lastPublication'), icon: 'i-heroicons-calendar' }
])

function sortProjectsFn(list: ProjectWithRole[], sortBy: string, sortOrder: 'asc' | 'desc') {
  return [...list].sort((a, b) => {
    let result = 0
    if (sortBy === 'alphabetical') {
      result = a.name.localeCompare(b.name)
    } else if (sortBy === 'role') {
      const weightA = roleWeights[a.role || 'viewer'] || 0
      const weightB = roleWeights[b.role || 'viewer'] || 0
      result = weightB - weightA // Descending weight for better roles first? Usually Owner first.
      // If we want Owner first (weight 4) then desc logic means 4 > 1.
    } else if (sortBy === 'publicationsCount') {
      result = (a.publicationsCount || 0) - (b.publicationsCount || 0)
    } else if (sortBy === 'lastPublication') {
      const dateA = a.lastPublicationAt ? new Date(a.lastPublicationAt).getTime() : 0
      const dateB = b.lastPublicationAt ? new Date(b.lastPublicationAt).getTime() : 0
      result = dateA - dateB
    }

    // Usually we want Ascending for alphabetical, but Descending for counts/dates?
    // The previous implementation used a global sortOrder switch.
    // So if user selects Count and ASC, it shows 0...10.
    // If we want to standard behavior, valid.
    return sortOrder === 'asc' ? result : -result
  })
}

const { 
  sortBy, 
  sortOrder, 
  toggleSortOrder,
  sortList
} = useSorting<ProjectWithRole>({
  storageKey: 'projects',
  defaultSortBy: 'alphabetical',
  sortOptions: sortOptions.value,
  sortFn: sortProjectsFn
})

// Use local sortOptions for template
const activeSortOption = computed(() => sortOptions.value.find(opt => opt.id === sortBy.value))

const sortedProjects = computed(() => sortList(projects.value))
const sortedArchivedProjects = computed(() => archivedProjects.value) // Not sorted by default logic for now to keep simple

// Fetch active projects
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
    try {
        archivedProjects.value = await fetchArchivedProjects()
    } finally {
        isLoadingArchived.value = false
    }
  }
}

/**
 * Navigate to create project page
 */
function goToCreateProject() {
  router.push('/projects/new')
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('project.titlePlural') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('project.myProjects') }}
        </p>
      </div>
      
      <div class="flex items-center gap-2">
        <template v-if="projects.length > 0">
          <USelectMenu
            v-model="sortBy"
            :items="sortOptions"
            value-key="id"
            label-key="label"
            class="w-56"
            :searchable="false"
            :loading="projects.length === 0"
          >
            <template #leading>
              <UIcon v-if="activeSortOption" :name="activeSortOption.icon" class="w-4 h-4" />
            </template>
          </USelectMenu>
          <UButton
            :icon="sortOrder === 'asc' ? 'i-heroicons-bars-arrow-up' : 'i-heroicons-bars-arrow-down'"
            color="neutral"
            variant="ghost"
            @click="toggleSortOrder"
            :title="sortOrder === 'asc' ? t('common.sortOrder.asc') : t('common.sortOrder.desc')"
          />
        </template>

        <UButton icon="i-heroicons-plus" @click="goToCreateProject" color="primary">
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
          {{ showArchived ? t('common.hideArchived', 'Hide Archived') : t('common.showArchived', 'Show Archived') }}
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
          <p class="text-gray-500 dark:text-gray-400">{{ t('project.noArchived', 'No archived projects') }}</p>
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
