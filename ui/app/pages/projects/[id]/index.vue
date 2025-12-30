<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
  updateProject,
  deleteProject,
  clearCurrentProject,
  canEdit,
  canDelete,
  canManageMembers,
  getRoleDisplayName,
} = useProjects()

const projectId = computed(() => route.params.id as string)
const isEditMode = computed(() => route.query.edit === 'true')

// Delete confirmation modal state
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const isSaving = ref(false)

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
 * Toggle edit mode
 */
function toggleEditMode() {
  router.replace({
    query: { ...route.query, edit: isEditMode.value ? undefined : 'true' },
  })
}

/**
 * Cancel editing
 */
function cancelEdit() {
  router.replace({
    query: { ...route.query, edit: undefined },
  })
}

/**
 * Handle project update
 */
async function handleUpdate(data: { name: string; description: string }) {
  if (!projectId.value) return

  isSaving.value = true
  const result = await updateProject(projectId.value, {
    name: data.name,
    description: data.description,
  })
  isSaving.value = false

  if (result) {
    cancelEdit()
  }
}

/**
 * Open delete confirmation modal
 */
function confirmDelete() {
  showDeleteModal.value = true
}

/**
 * Handle project deletion
 */
async function handleDelete() {
  if (!projectId.value) return

  isDeleting.value = true
  const success = await deleteProject(projectId.value)
  isDeleting.value = false

  if (success) {
    showDeleteModal.value = false
    router.push('/projects')
  }
}

/**
 * Cancel delete action
 */
function cancelDelete() {
  showDeleteModal.value = false
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

    <!-- Edit mode -->
    <div v-else-if="isEditMode && canEdit(currentProject)" class="max-w-4xl mx-auto">
      <FormsProjectForm
        :project="currentProject"
        :is-loading="isSaving"
        @submit="handleUpdate"
        @cancel="cancelEdit"
      />
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
                  {{ currentProject.owner.fullName || currentProject.owner.username || 'Unknown' }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-users" class="w-4 h-4" />
                  {{ t('project.members') }}: {{ currentProject.memberCount || 0 }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-signal" class="w-4 h-4" />
                  {{ t('channel.titlePlural') }}: {{ currentProject.channelCount || 0 }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                  {{ d(new Date(currentProject.createdAt || ''), 'long') }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 ml-4">
              <UButton
                v-if="canEdit(currentProject)"
                color="primary"
                variant="outline"
                icon="i-heroicons-pencil-square"
                @click="toggleEditMode"
              >
                {{ t('common.edit') }}
              </UButton>
              <UButton
                v-if="canDelete(currentProject)"
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                @click="confirmDelete"
              >
                {{ t('common.delete') }}
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <!-- Channels card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UIcon name="i-heroicons-signal" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ t('channel.titlePlural') }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ currentProject.channelCount || 0 }} {{ t('channel.titlePlural').toLowerCase() }}
              </p>
            </div>
          </div>
          <UButton
            icon="i-heroicons-arrow-down"
            class="w-full"
            variant="outline"
            @click="$el?.querySelector('#channels-section')?.scrollIntoView({ behavior: 'smooth' })"
          >
            {{ t('common.view') }} {{ t('channel.titlePlural').toLowerCase() }}
          </UButton>
        </div>

        <!-- Members card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UIcon
                name="i-heroicons-users"
                class="w-6 h-6 text-purple-600 dark:text-purple-400"
              />
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ t('projectMember.titlePlural') }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ currentProject.memberCount || 0 }} {{ t('projectMember.titlePlural').toLowerCase() }}
              </p>
            </div>
          </div>
          <UButton
            v-if="canManageMembers(currentProject)"
            icon="i-heroicons-user-plus"
            class="w-full"
            disabled
          >
            {{ t('projectMember.invite') }}
          </UButton>
          <UButton
            v-else
            icon="i-heroicons-eye"
            color="neutral"
            variant="outline"
            class="w-full"
            disabled
          >
            {{ t('common.view', 'View') }}
          </UButton>
        </div>

        <!-- Posts card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UIcon
                name="i-heroicons-document-text"
                class="w-6 h-6 text-green-600 dark:text-green-400"
              />
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ t('post.titlePlural') }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ currentProject.postCount || 0 }} {{ t('post.titlePlural').toLowerCase() }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-heroicons-arrow-right"
              class="flex-1"
              variant="outline"
              :to="`/projects/${currentProject.id}/posts`"
            >
              {{ t('common.view') }}
            </UButton>
            <UButton
              icon="i-heroicons-plus"
              color="primary"
              :to="`/projects/${currentProject.id}/posts/new`"
            >
              {{ t('common.create') }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Project info section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('common.info', 'Information') }}
          </h2>
        </div>
        <div class="p-6">
          <dl class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
                {{ t('project.name') }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ currentProject.name }}
              </dd>
            </div>
            <div class="flex flex-col sm:flex-row sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
                {{ t('project.description') }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ currentProject.description || '-' }}
              </dd>
            </div>
            <div class="flex flex-col sm:flex-row sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
                {{ t('user.role') }}
              </dt>
              <dd class="text-sm">
                <UBadge :color="getRoleBadgeColor(currentProject.role)" variant="subtle">
                  {{ getRoleDisplayName(currentProject.role) }}
                </UBadge>
              </dd>
            </div>
            <div class="flex flex-col sm:flex-row sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
                {{ t('user.createdAt') }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ d(new Date(currentProject.createdAt || ''), 'long') }}
              </dd>
            </div>
            <div v-if="currentProject.updatedAt" class="flex flex-col sm:flex-row sm:gap-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">Updated</dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ d(new Date(currentProject.updatedAt), 'long') }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Members Section -->
      <div id="members-section" class="bg-white dark:bg-gray-800 rounded-lg shadow mt-6 p-6">
        <ProjectsProjectMembersList :project-id="currentProject.id" />
      </div>

      <!-- Channels Section -->
      <div id="channels-section" class="bg-white dark:bg-gray-800 rounded-lg shadow mt-6 p-6">
        <FeaturesChannelsList :project-id="currentProject.id" />
      </div>
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
