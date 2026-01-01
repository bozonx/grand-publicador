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
      <ProjectsProjectListItem
        v-for="project in projects"
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
            v-for="project in archivedProjects"
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
