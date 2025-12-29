<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { BlogMemberWithUser } from '~/stores/blogs'
import type { TableColumn } from '@nuxt/ui'

// Re-defining BadgeColor locally as it matches UBadge prop type
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const props = defineProps<{
  blogId: string
}>()

const { t } = useI18n()
const {
  fetchMembers,
  members,
  isLoading,
  removeMember,
  updateMemberRole,
  currentBlog,
  canManageMembers,
} = useBlogs()

const isInviteModalOpen = ref(false)

// Init
onMounted(() => {
  if (props.blogId) {
    fetchMembers(props.blogId)
  }
})

const canManage = computed(() => currentBlog.value && canManageMembers(currentBlog.value))

// Define typed columns for the table
const columns = computed<TableColumn<BlogMemberWithUser>[]>(() => [
  { accessorKey: 'user', header: t('user.username') },
  { accessorKey: 'role', header: t('user.role') },
  { accessorKey: 'actions', header: '' },
])

function getRoleBadgeColor(role: string | undefined): BadgeColor {
  const colors: Record<string, BadgeColor> = {
    owner: 'primary',
    admin: 'secondary',
    editor: 'info',
    viewer: 'neutral',
  }
  return colors[role || 'viewer'] || 'neutral'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActionItems(row: any) {
  const actions = []

  // Role change actions
  const roles: Database['public']['Enums']['blog_role'][] = ['admin', 'editor', 'viewer']
  const roleActions = roles
    .filter((r) => r !== row.role)
    .map((role) => ({
      label: t(`roles.${role}`),
      icon: 'i-heroicons-arrow-path',
      click: () => updateMemberRole(props.blogId, row.user.id, role),
    }))

  if (roleActions.length > 0) {
    actions.push(roleActions)
  }

  // Remove action
  actions.push([
    {
      label: t('blogMember.remove'),
      icon: 'i-heroicons-trash-20-solid',
      click: () => handleRemove(row),
      class: 'text-red-500 dark:text-red-400',
    },
  ])

  return actions
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRemove(row: any) {
  if (confirm(t('blogMember.removeConfirm'))) {
    await removeMember(props.blogId, row.user.id)
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ t('blogMember.titlePlural') }}
      </h3>
      <UButton
        v-if="canManage"
        icon="i-heroicons-user-plus"
        size="sm"
        color="primary"
        @click="isInviteModalOpen = true"
      >
        {{ t('blogMember.invite') }}
      </UButton>
    </div>

    <UTable
      :data="members"
      :columns="columns"
      :loading="isLoading"
      :empty-state="{ icon: 'i-heroicons-users', label: t('common.noData') }"
      class="w-full"
    >
      <template #user-cell="{ row }">
        <div class="flex items-center gap-3">
          <UAvatar
            :src="row.original.user.avatar_url ?? undefined"
            :alt="row.original.user.username ?? row.original.user.full_name ?? undefined"
            size="sm"
          />
          <div>
            <div class="font-medium text-gray-900 dark:text-white text-sm">
              {{ row.original.user.full_name || row.original.user.username }}
            </div>
            <div class="text-xs text-gray-500">
              {{ row.original.user.email }}
            </div>
          </div>
        </div>
      </template>

      <template #role-cell="{ row }">
        <UBadge
          :color="getRoleBadgeColor(row.original.role ?? undefined)"
          size="xs"
          variant="subtle"
        >
          {{ t(`roles.${row.original.role ?? 'viewer'}`) }}
        </UBadge>
      </template>

      <template #actions-cell="{ row }">
        <UDropdownMenu
          v-if="canManage && row.original.role !== 'owner'"
          :items="getActionItems(row.original)"
        >
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-ellipsis-vertical-20-solid"
            size="xs"
          />
        </UDropdownMenu>
      </template>
    </UTable>

    <BlogsInviteMemberModal
      v-model="isInviteModalOpen"
      :blog-id="blogId"
      @success="fetchMembers(blogId)"
    />
  </div>
</template>
