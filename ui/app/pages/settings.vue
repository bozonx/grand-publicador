<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t, locale, setLocale, availableLocales } = useI18n()
const { user, displayName, authMode, refreshUser } = useAuth()
const toast = useToast()
const colorMode = useColorMode()

const api = useApi()
const isSyncing = ref(false)

// API Tokens
const {
  tokens,
  loading: tokensLoading,
  fetchTokens,
  createToken,
  updateToken,
  deleteToken,
  copyToken,
} = useApiTokens()

const projects = ref<any[]>([])
const showCreateTokenModal = ref(false)
const showEditTokenModal = ref(false)
const editingToken = ref<any>(null)
const newTokenName = ref('')
const newTokenScope = ref<string[]>([])
const limitToProjects = ref(false)
const visibleTokens = ref<Set<string>>(new Set())

// Load tokens and projects on mount
onMounted(() => {
  fetchTokens()
  fetchProjects()
})

async function fetchProjects() {
  try {
    projects.value = await api.get('/projects')
  } catch (err) {
    console.error('Failed to fetch projects:', err)
  }
}

// Toggle token visibility
function toggleTokenVisibility(tokenId: string) {
  if (visibleTokens.value.has(tokenId)) {
    visibleTokens.value.delete(tokenId)
  } else {
    visibleTokens.value.add(tokenId)
  }
}

// Create new token
async function handleCreateToken() {
  if (!newTokenName.value.trim()) {
    toast.add({
      title: t('common.error'),
      description: 'Token name is required',
      color: 'error',
    })
    return
  }

  try {
    await createToken({
      name: newTokenName.value,
      scopeProjectIds: limitToProjects.value ? newTokenScope.value : [],
    })
    showCreateTokenModal.value = false
    newTokenName.value = ''
    newTokenScope.value = []
    limitToProjects.value = false
  } catch (err) {
    // Error handled in composable
  }
}

// Edit token
function openEditModal(token: any) {
  editingToken.value = token
  newTokenName.value = token.name
  newTokenScope.value = token.scopeProjectIds || []
  limitToProjects.value = token.scopeProjectIds?.length > 0
  showEditTokenModal.value = true
}

async function handleUpdateToken() {
  if (!editingToken.value || !newTokenName.value.trim()) return

  try {
    await updateToken(editingToken.value.id, {
      name: newTokenName.value,
      scopeProjectIds: limitToProjects.value ? newTokenScope.value : [],
    })
    showEditTokenModal.value = false
    editingToken.value = null
    newTokenName.value = ''
    newTokenScope.value = []
    limitToProjects.value = false
  } catch (err) {
    // Error handled in composable
  }
}

// Delete token
async function handleDeleteToken(tokenId: string) {
  if (confirm(t('settings.confirmDeleteToken', 'Are you sure you want to delete this token?'))) {
    await deleteToken(tokenId)
  }
}

// Format scope display
function formatScope(scopeProjectIds: string[]) {
  if (!scopeProjectIds || scopeProjectIds.length === 0) {
    return t('settings.allProjects', 'All projects')
  }
  const projectNames = scopeProjectIds
    .map((id) => projects.value?.find((p: any) => p.id === id)?.name)
    .filter(Boolean)
  return projectNames.join(', ') || t('settings.selectedProjects', 'Selected projects')
}

// Language options
const languageOptions = computed(() =>
  availableLocales.map((loc: string) => ({
    value: loc,
    label: loc === 'ru-RU' ? 'Русский' : 'English',
  }))
)

/**
 * Sync name from Telegram or fallbacks and update in backend
 */
async function syncName() {
  isSyncing.value = true
  
  try {
    let nameToSave = ''
    let avatarToSave = ''

    // Try to get from Telegram WebApp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user
    
    if (tgUser) {
      const first = tgUser.first_name || ''
      const last = tgUser.last_name || ''
      const full = [first, last].filter(Boolean).join(' ')
      if (full) {
        nameToSave = full
      } else if (tgUser.username) {
        nameToSave = tgUser.username
      }
      
      if (tgUser.photo_url) {
        avatarToSave = tgUser.photo_url
      }
    }
    
    // Fallback if no Telegram WebApp data found (dev mode or just missing)
    if (!nameToSave) {
      // Fallback to existing username
      if (user.value?.telegramUsername) {
        nameToSave = user.value.telegramUsername
      } 
      // Fallback to ID
      else if (user.value?.id) {
        nameToSave = user.value.id
      }
    }

    if (!nameToSave) {
        toast.add({
            title: t('common.warning'),
            description: t('settings.noNameFound', 'Could not determine name from Telegram'),
            color: 'warning',
        })
        return
    }

    // Call API to update profile
    await api.patch('/users/me', { 
        fullName: nameToSave,
        ...(avatarToSave && { avatarUrl: avatarToSave })
    })
    
    // Refresh user data locally
    await refreshUser()
    
    toast.add({
      title: t('common.success'),
      description: t('settings.syncedSuccess', 'Profile synced with Telegram'),
      color: 'success',
    })
  } catch (err) {
    console.error('Failed to sync name:', err)
    toast.add({
      title: t('common.error'),
      description: t('settings.syncError', 'Failed to sync name'),
      color: 'error',
    })
  } finally {
    isSyncing.value = false
  }
}

/**
 * Change language
 */
function changeLanguage(newLocale: string) {
  setLocale(newLocale as any)
  // Save to localStorage for persistence
  localStorage.setItem('locale', newLocale)
  toast.add({
    title: t('common.success'),
    description: t('settings.languageChanged', 'Language changed'),
    color: 'success',
  })
}

// Format date helper
function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('settings.title') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ t('settings.account') }}
      </p>
    </div>

    <!-- Profile section -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ t('auth.profile') }}
        </h2>
      </template>
      
      <!-- Avatar and basic info -->
      <div class="flex items-start gap-4 mb-6">
        <UAvatar
          :src="user?.avatarUrl || undefined"
          :alt="displayName"
          size="xl"
          :ui="{
            fallback:
              'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300',
          }"
        />
        <div class="flex-1 min-w-0">
          <!-- Name display & Sync Button -->
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ displayName }}
            </h3>
            
            <UTooltip :text="t('settings.syncName', 'Sync name from Telegram')">
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-arrow-path"
                :loading="isSyncing"
                @click="syncName"
              />
            </UTooltip>
          </div>

          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ user?.telegramId ? `Telegram ID: ${user.telegramId}` : '' }}
          </p>
        </div>
      </div>

      <!-- Profile details -->
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ t('user.username') }}
          </dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ user?.telegramUsername ? `@${user.telegramUsername}` : '—' }}
          </dd>
        </div>

        <div v-if="user?.telegramId">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ t('user.telegramId') }}
          </dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ user.telegramId }}
          </dd>
        </div>
        <!-- Auth Mode -->
        <div>
          <div class="flex items-center gap-1">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('auth.authMode') }}
            </dt>
            <UTooltip :text="t('auth.authModeHelp')">
              <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-gray-400" />
            </UTooltip>
          </div>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white capitalize">
            {{ t(`auth.${authMode}Mode`) }}
          </dd>
        </div>


        <!-- Admin Status -->
        <!-- Admin Status -->
        <div v-if="user?.isAdmin">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ t('user.adminStatus') }}
          </dt>
          <dd class="mt-1">
            <UBadge
              color="primary"
              variant="solid"
              size="sm"
            >
              {{ t('user.isAdmin') }}
            </UBadge>
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ t('user.createdAt') }}
          </dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ formatDate(user?.createdAt) }}
          </dd>
        </div>
      </dl>
    </UCard>

    <!-- Language section -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ t('settings.language') }}
        </h2>
      </template>
      
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {{ t('settings.selectLanguage', 'Select your preferred language for the interface') }}
      </p>
      <div class="flex flex-wrap gap-3">
        <UButton
          v-for="lang in languageOptions"
          :key="lang.value"
          :color="locale === lang.value ? 'primary' : 'neutral'"
          :variant="locale === lang.value ? 'solid' : 'outline'"
          size="lg"
          @click="changeLanguage(lang.value)"
        >
          {{ lang.label }}
        </UButton>
      </div>
    </UCard>

    <!-- Theme section -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ t('settings.theme') }}
        </h2>
      </template>

      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {{ t('settings.themeDescription', 'Choose your preferred theme interface aesthetics.') }}
      </p>
      
      <ClientOnly>
        <div class="flex flex-wrap gap-3">
          <UButton
            v-for="theme in ['system', 'light', 'dark']"
            :key="theme"
            :color="colorMode.preference === theme ? 'primary' : 'neutral'"
            :variant="colorMode.preference === theme ? 'solid' : 'outline'"
            size="lg"
            :icon="
              theme === 'system' 
                ? 'i-heroicons-computer-desktop' 
                : theme === 'light' 
                  ? 'i-heroicons-sun' 
                  : 'i-heroicons-moon'
            "
            @click="colorMode.preference = theme"
          >
            <span class="capitalize">{{ t(`settings.${theme}Theme`, theme) }}</span>
          </UButton>
        </div>
        
        <template #fallback>
          <div class="flex flex-wrap gap-3">
            <USkeleton class="h-10 w-24" />
            <USkeleton class="h-10 w-24" />
            <USkeleton class="h-10 w-24" />
          </div>
        </template>
      </ClientOnly>

      <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">
        {{
          t(
            'settings.themeNote',
            'System theme will automatically adapt to your device settings.'
          )
        }}
      </p>
    </UCard>

    <!-- API Tokens section -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            API Tokens
          </h2>
          <UButton
            color="primary"
            size="sm"
            icon="i-heroicons-plus"
            @click="showCreateTokenModal = true"
          >
            {{ t('settings.createToken', 'Create Token') }}
          </UButton>
        </div>
      </template>

      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {{ t('settings.apiTokensDescription', 'Manage API tokens for external integrations and automation') }}
      </p>

      <div v-if="tokensLoading" class="space-y-3">
        <USkeleton class="h-16 w-full" v-for="i in 2" :key="i" />
      </div>

      <div v-else-if="tokens.length === 0" class="text-center py-8">
        <UIcon name="i-heroicons-key" class="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('settings.noTokens', 'No API tokens yet') }}
        </p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="token in tokens"
          :key="token.id"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <h3 class="font-medium text-gray-900 dark:text-white">
                {{ token.name }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ t('settings.scope') }}: {{ formatScope(token.scopeProjectIds) }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-pencil"
                @click="openEditModal(token)"
              />
              <UButton
                color="error"
                variant="ghost"
                size="xs"
                icon="i-heroicons-trash"
                @click="handleDeleteToken(token.id)"
              />
            </div>
          </div>

          <div class="flex items-center gap-2 mt-3">
            <div class="flex-1 font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {{ visibleTokens.has(token.id) ? token.plainToken : '••••••••••••••••••••••••' }}
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              :icon="visibleTokens.has(token.id) ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
              @click="toggleTokenVisibility(token.id)"
            />
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-clipboard-document"
              @click="copyToken(token.plainToken)"
            />
          </div>

          <div class="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{{ t('settings.created') }}: {{ formatDate(token.createdAt) }}</span>
            <span v-if="token.lastUsedAt">
              {{ t('settings.lastUsed') }}: {{ formatDate(token.lastUsedAt) }}
            </span>
            <span v-else>{{ t('settings.neverUsed', 'Never used') }}</span>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Create Token Modal -->
    <UModal 
      v-model:open="showCreateTokenModal" 
      :title="t('settings.createToken', 'Create API Token')"
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField :label="t('settings.tokenName', 'Token Name')" required>
            <UInput v-model="newTokenName" placeholder="My Integration Token" class="w-full" />
          </UFormField>

          <UFormField>
            <UCheckbox
              v-model="limitToProjects"
              :label="t('settings.limitToProjects', 'Limit to specific projects')"
            />
          </UFormField>

          <UFormField v-if="limitToProjects" :label="t('settings.selectProjects', 'Select Projects')">
            <USelectMenu
              v-model="newTokenScope"
              :items="projects || []"
              label-key="name"
              value-key="id"
              multiple
              placeholder="Select projects..."
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="showCreateTokenModal = false">
            {{ t('common.cancel') }}
          </UButton>
          <UButton color="primary" @click="handleCreateToken" :loading="tokensLoading">
            {{ t('common.create') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Edit Token Modal -->
    <UModal 
      v-model:open="showEditTokenModal" 
      :title="t('settings.editToken', 'Edit API Token')"
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField :label="t('settings.tokenName', 'Token Name')" required>
            <UInput v-model="newTokenName" class="w-full" />
          </UFormField>

          <UFormField>
            <UCheckbox
              v-model="limitToProjects"
              :label="t('settings.limitToProjects', 'Limit to specific projects')"
            />
          </UFormField>

          <UFormField v-if="limitToProjects" :label="t('settings.selectProjects', 'Select Projects')">
            <USelectMenu
              v-model="newTokenScope"
              :items="projects || []"
              label-key="name"
              value-key="id"
              multiple
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="showEditTokenModal = false">
            {{ t('common.cancel') }}
          </UButton>
          <UButton color="primary" @click="handleUpdateToken" :loading="tokensLoading">
            {{ t('common.save') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
