<script setup lang="ts">
import type { UserWithStats } from '~/composables/useUsers'

definePageMeta({
  middleware: ['auth', 'admin'],
})

const { t, d } = useI18n()

const columns = [
  { key: 'user', label: t('user.username') },
  { key: 'email', label: t('auth.email') },
  { key: 'role', label: t('user.role') },
  { key: 'stats', label: t('admin.statistics') },
  { key: 'created_at', label: t('user.createdAt') },
  { key: 'actions', label: t('common.actions') }
]

const {
  users,
  isLoading,
  error,
  pagination,
  totalCount,
  totalPages,
  fetchUsers,
  toggleAdminStatus,
  setFilter,
  clearFilter,
  setPage,
  getUserDisplayName,
  getUserInitials,
} = useUsers()

// Filter state
const selectedAdminFilter = ref<string | null>(null)
const searchQuery = ref('')

// Confirmation modal state
const showConfirmModal = ref(false)
const userToToggle = ref<UserWithStats | null>(null)
const isToggling = ref(false)

// Fetch users on mount
onMounted(() => {
  fetchUsers()
})

// Admin filter options
const adminFilterOptions = computed(() => [
  { value: null, label: t('common.all') },
  { value: 'true', label: t('admin.adminsOnly', 'Admins only') },
  { value: 'false', label: t('admin.regularUsers', 'Regular users') },
])

// Watch for filter changes
watch([selectedAdminFilter, searchQuery], () => {
  const isAdminValue =
    selectedAdminFilter.value === null ? null : selectedAdminFilter.value === 'true'

  setFilter({
    is_admin: isAdminValue,
    search: searchQuery.value || undefined,
  })
  fetchUsers()
})

// Watch for page changes
watch(
  () => pagination.value.page,
  () => {
    fetchUsers()
  }
)

/**
 * Open confirmation modal
 */
function confirmToggleAdmin(user: UserWithStats) {
  userToToggle.value = user
  showConfirmModal.value = true
}

/**
 * Handle admin toggle
 */
async function handleToggleAdmin() {
  if (!userToToggle.value) return

  isToggling.value = true
  await toggleAdminStatus(userToToggle.value.id)
  isToggling.value = false
  showConfirmModal.value = false
  userToToggle.value = null
}

/**
 * Cancel admin toggle
 */
function cancelToggle() {
  showConfirmModal.value = false
  userToToggle.value = null
}

/**
 * Reset all filters
 */
function resetFilters() {
  selectedAdminFilter.value = null
  searchQuery.value = ''
  clearFilter()
  fetchUsers()
}



/**
 * Check if any filter is active
 */
const hasActiveFilters = computed(() => {
  return selectedAdminFilter.value !== null || searchQuery.value
})

const rows = computed<UserWithStats[]>(() => users.value)
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('admin.userManagement', 'User Management') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ totalCount }} {{ t('navigation.users').toLowerCase() }}
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Search -->
        <UInput
          v-model="searchQuery"
          :placeholder="t('admin.searchUsers', 'Search by name, username, or email')"
          icon="i-heroicons-magnifying-glass"
          class="sm:col-span-2"
        />

        <!-- Admin filter -->
        <USelect
          v-model="selectedAdminFilter"
          :options="adminFilterOptions"
          option-attribute="label"
          value-attribute="value"
          :placeholder="t('admin.filterByRole', 'Filter by role')"
        />
      </div>

      <!-- Reset filters button -->
      <div v-if="hasActiveFilters" class="mt-4">
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-heroicons-x-mark"
          @click="resetFilters"
        >
          {{ t('common.reset') }}
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
    <div v-else-if="isLoading && users.length === 0" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3"
        />
        <p class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="users.length === 0"
      class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center"
    >
      <UIcon
        name="i-heroicons-users"
        class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('admin.noUsersFound', 'No users found') }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400">
        {{
          hasActiveFilters
            ? t('admin.noUsersFiltered', 'No users match your filters')
            : t('admin.noUsersDescription', 'There are no users in the system yet')
        }}
      </p>
    </div>

    <!-- Users table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <UTable
        :rows="rows"
        :columns="columns"
        :loading="isLoading"
      >
        <!-- User info column -->
        <template #user-data="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar
              :src="row.avatar_url ?? undefined"
              :alt="getUserDisplayName(row)"
              size="sm"
            >
              <template #fallback>
                <span class="text-xs">{{ getUserInitials(row) }}</span>
              </template>
            </UAvatar>
            <div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ row.full_name || '-' }}
              </div>
              <div class="text-sm text-gray-500">@{{ row.username || 'no-username' }}</div>
            </div>
          </div>
        </template>

        <!-- Role column -->
        <template #role-data="{ row }">
          <UBadge
            :color="row.is_admin ? 'primary' : 'neutral'"
            :variant="row.is_admin ? 'solid' : 'outline'"
            size="sm"
          >
            {{ row.is_admin ? t('user.isAdmin') : t('admin.regularUser') }}
          </UBadge>
        </template>

        <!-- Statistics column -->
        <template #stats-data="{ row }">
          <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-book-open" class="w-4 h-4" />
              {{ row.blogsCount || 0 }} {{ t('blog.titlePlural').toLowerCase() }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
              {{ row.postsCount || 0 }} {{ t('post.titlePlural').toLowerCase() }}
            </span>
          </div>
        </template>

        <!-- Created at column -->
        <template #created_at-data="{ row }">
          {{ d(new Date(row.created_at), 'long') }}
        </template>

        <!-- Actions column -->
        <template #actions-data="{ row }">
          <div class="text-right">
            <UButton
              :color="row.is_admin ? 'warning' : 'success'"
              variant="ghost"
              size="sm"
              :icon="row.is_admin ? 'i-heroicons-shield-exclamation' : 'i-heroicons-shield-check'"
              @click="confirmToggleAdmin(row)"
            >
              {{ row.is_admin ? t('admin.revokeAdmin') : t('admin.grantAdmin') }}
            </UButton>
          </div>
        </template>
      </UTable>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
      <UButton
        :disabled="pagination.page <= 1"
        variant="outline"
        color="neutral"
        icon="i-heroicons-chevron-left"
        size="sm"
        @click="setPage(pagination.page - 1)"
      />

      <span class="text-sm text-gray-600 dark:text-gray-400 px-4">
        {{ pagination.page }} / {{ totalPages }}
      </span>

      <UButton
        :disabled="pagination.page >= totalPages"
        variant="outline"
        color="neutral"
        icon="i-heroicons-chevron-right"
        size="sm"
        @click="setPage(pagination.page + 1)"
      />
    </div>

    <!-- Confirm toggle admin modal -->
    <UModal v-model:open="showConfirmModal">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-4 mb-4">
            <div
              class="p-2 rounded-lg"
              :class="
                userToToggle?.is_admin
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-green-100 dark:bg-green-900/30'
              "
            >
              <UIcon
                :name="
                  userToToggle?.is_admin
                    ? 'i-heroicons-shield-exclamation'
                    : 'i-heroicons-shield-check'
                "
                class="w-6 h-6"
                :class="
                  userToToggle?.is_admin
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-green-600 dark:text-green-400'
                "
              />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{
                userToToggle?.is_admin
                  ? t('admin.revokeAdmin', 'Revoke admin')
                  : t('admin.grantAdmin', 'Grant admin')
              }}
            </h3>
          </div>

          <p class="text-gray-600 dark:text-gray-400 mb-2">
            {{
              userToToggle?.is_admin
                ? t(
                    'admin.revokeAdminConfirm',
                    'Are you sure you want to revoke admin rights from this user?'
                  )
                : t(
                    'admin.grantAdminConfirm',
                    'Are you sure you want to grant admin rights to this user?'
                  )
            }}
          </p>

          <div
            v-if="userToToggle"
            class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6"
          >
            <UAvatar
              :src="userToToggle.avatar_url ?? undefined"
              :alt="getUserDisplayName(userToToggle)"
              size="sm"
            />
            <div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ getUserDisplayName(userToToggle) }}
              </div>
              <div class="text-sm text-gray-500">
                {{ userToToggle.email || userToToggle.username }}
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="isToggling"
              @click="cancelToggle"
            >
              {{ t('common.cancel') }}
            </UButton>
            <UButton
              :color="userToToggle?.is_admin ? 'warning' : 'success'"
              :loading="isToggling"
              @click="handleToggleAdmin"
            >
              {{
                userToToggle?.is_admin
                  ? t('admin.revokeAdmin', 'Revoke admin')
                  : t('admin.grantAdmin', 'Grant admin')
              }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
