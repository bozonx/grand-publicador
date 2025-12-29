<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const router = useRouter()
const { projects, isLoading, error, fetchProjects, deleteProject, canEdit, canDelete, getRoleDisplayName } =
  useProjects()

// Delete confirmation modal state
const showDeleteModal = ref(false)
const projectToDelete = ref<string | null>(null)
const isDeleting = ref(false)

// Fetch projects on mount
onMounted(() => {
  fetchProjects()
})

/**
 * Navigate to create project page
 */
function goToCreateProject() {
  router.push('/projects/new')
}

/**
 * Navigate to project details page
 */
function goToProject(projectId: string) {
  router.push(`/projects/${projectId}`)
}

/**
 * Navigate to edit project page
 */
function goToEditProject(projectId: string) {
  router.push(`/projects/${projectId}?edit=true`)
}

/**
 * Open delete confirmation modal
 */
function confirmDelete(projectId: string) {
  projectToDelete.value = projectId
  showDeleteModal.value = true
}

/**
 * Handle project deletion
 */
async function handleDelete() {
  if (!projectToDelete.value) return

  isDeleting.value = true
  const success = await deleteProject(projectToDelete.value)
  isDeleting.value = false

  if (success) {
    showDeleteModal.value = false
    projectToDelete.value = null
  }
}

/**
 * Cancel delete action
 */
function cancelDelete() {
  showDeleteModal.value = false
  projectToDelete.value = null
}

/**
 * Format date for display
 */
function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
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
      <UButton icon="i-heroicons-plus" @click="goToCreateProject">
        {{ t('project.createProject') }}
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
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
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
      <div
        v-for="project in projects"
        :key="project.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        @click="goToProject(project.id)"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {{ project.name }}
                </h3>
                <UBadge :color="getRoleBadgeColor(project.role)" variant="subtle" size="sm">
                  {{ getRoleDisplayName(project.role) }}
                </UBadge>
              </div>

              <p
                v-if="project.description"
                class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3"
              >
                {{ project.description }}
              </p>

              <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span v-if="project.owner" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-user" class="w-4 h-4" />
                  {{ project.owner.fullName || project.owner.username || 'Unknown' }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                  {{ formatDate(project.createdAt) }}
                </span>
              </div>
            </div>

            <!-- Actions dropdown -->
            <div class="ml-4" @click.stop>
              <UDropdownMenu
                :items="[
                  [
                    {
                      label: t('common.edit'),
                      icon: 'i-heroicons-pencil-square',
                      disabled: !canEdit(project),
                      click: () => goToEditProject(project.id),
                    },
                  ],
                  [
                    {
                      label: t('common.delete'),
                      icon: 'i-heroicons-trash',
                      disabled: !canDelete(project),
                      color: 'error' as const,
                      click: () => confirmDelete(project.id),
                    },
                  ],
                ]"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-ellipsis-vertical"
                  :aria-label="t('common.actions')"
                />
              </UDropdownMenu>
            </div>
          </div>
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

    <!-- Delete confirmation modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-6 h-6 text-red-600 dark:text-red-400"
              />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('project.deleteProject') }}
            </h3>
          </div>

          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t('project.deleteConfirm') }}
          </p>

          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="isDeleting" @click="cancelDelete">
              {{ t('common.cancel') }}
            </UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">
              {{ t('common.delete') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
