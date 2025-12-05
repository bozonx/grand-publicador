<script setup lang="ts">
import type { Database } from '~/types/database.types'

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
  canManageMembers 
} = useBlogs()

const isInviteModalOpen = ref(false)

// Init
onMounted(() => {
  if (props.blogId) {
    fetchMembers(props.blogId)
  }
})

const canManage = computed(() => currentBlog.value && canManageMembers(currentBlog.value))

const columns = [
  { key: 'user', label: t('user.username') },
  { key: 'role', label: t('user.role') },
  { key: 'actions', label: '' }
]

function getRoleBadgeColor(role: string | undefined): BadgeColor {
  const colors: Record<string, BadgeColor> = {
    owner: 'primary',
    admin: 'secondary',
    editor: 'info',
    viewer: 'neutral'
  }
  return colors[role || 'viewer'] || 'neutral'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActionItems(row: any) {
  const actions = []

  // Role change actions
  const roles: Database['public']['Enums']['blog_role'][] = ['admin', 'editor', 'viewer']
  const roleActions = roles
    .filter(r => r !== row.role)
    .map(role => ({
      label: t(`roles.${role}`),
      icon: 'i-heroicons-arrow-path',
      click: () => updateMemberRole(props.blogId, row.user.id, role)
    }))

  if (roleActions.length > 0) {
    actions.push(roleActions)
  }

  // Remove action
  actions.push([{
    label: t('blogMember.remove'),
    icon: 'i-heroicons-trash-20-solid',
    click: () => handleRemove(row),
    class: 'text-red-500 dark:text-red-400'
  }])

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
      :rows="members"
      :columns="columns"
      :loading="isLoading"
      :empty-state="{ icon: 'i-heroicons-users', label: t('common.noData') }"
      class="w-full"
    >
      <template #user-data="{ row }">
        <div class="flex items-center gap-3">
          <UAvatar
            :src="row.user.avatar_url"
            :alt="row.user.username || row.user.full_name"
            size="sm"
          />
          <div>
            <div class="font-medium text-gray-900 dark:text-white text-sm">
              {{ row.user.full_name || row.user.username }}
            </div>
            <div class="text-xs text-gray-500">
              {{ row.user.email }}
            </div>
          </div>
        </div>
      </template>

      <template #role-data="{ row }">
        <UBadge :color="getRoleBadgeColor(row.role)" size="xs" variant="subtle">
          {{ t(`roles.${row.role}`) }}
        </UBadge>
      </template>

      <template #actions-data="{ row }">
        <UDropdown
          v-if="canManage && row.role !== 'owner'"
          :items="getActionItems(row)"
        >
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-ellipsis-vertical-20-solid"
            size="xs"
          />
        </UDropdown>
      </template>
    </UTable>

    <BlogsInviteMemberModal
      v-model="isInviteModalOpen"
      :blog-id="blogId"
      @success="fetchMembers(blogId)"
    />
  </div>
</template>
