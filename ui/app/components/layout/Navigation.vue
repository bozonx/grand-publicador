<script setup lang="ts">
import type { ProjectWithRole } from '~/stores/projects'
import type { ChannelWithProject } from '~/composables/useChannels'

const { t } = useI18n()
const { isAdmin } = useAuth()
const route = useRoute()
const api = useApi()

interface NavItem {
  label: string
  to: string
  icon: string
  adminOnly?: boolean
}

// Static nav items (Dashboard, Channels)
const mainNavItems = computed<NavItem[]>(() => [
  {
    label: t('navigation.dashboard'),
    to: '/',
    icon: 'i-heroicons-home',
  },
  {
    label: t('navigation.channels'),
    to: '/channels',
    icon: 'i-heroicons-hashtag',
  },
])

// Static functional items (Settings) - Admin is handled separately
const bottomNavItems = computed<NavItem[]>(() => [
  {
    label: t('navigation.admin'),
    to: '/admin',
    icon: 'i-heroicons-cog-8-tooth',
    adminOnly: true,
  },
  {
    label: t('navigation.settings'),
    to: '/settings',
    icon: 'i-heroicons-cog-6-tooth',
  },
])

// Filtered bottom items
const visibleBottomNavItems = computed(() =>
  bottomNavItems.value.filter((item) => !item.adminOnly || isAdmin.value)
)

// Projects fetching
const { projects, fetchProjects, isLoading: isProjectsLoading } = useProjects()
const expandedProjects = ref<Set<string>>(new Set())
const projectChannels = ref<Record<string, ChannelWithProject[]>>({})
const areChannelsLoading = ref<Record<string, boolean>>({})

// Initialize
onMounted(async () => {
  await fetchProjects()
  checkActiveRoute()
})

// Watch route to auto-expand
watch(() => route.path, () => {
  checkActiveRoute()
})

function checkActiveRoute() {
  // Check if we are in a project route
  const match = route.path.match(/\/projects\/([^\/]+)/)
  if (match && match[1]) {
    const projectId = match[1]
    if (!expandedProjects.value.has(projectId)) {
      toggleProject(projectId)
    }
  }
}

async function toggleProject(projectId: string) {
  const isExpanded = expandedProjects.value.has(projectId)
  
  if (isExpanded) {
    expandedProjects.value.delete(projectId)
  } else {
    expandedProjects.value.add(projectId)
    // Fetch channels if not already loaded
    if (!projectChannels.value[projectId]) {
      await fetchProjectChannels(projectId)
    }
  }
}

async function fetchProjectChannels(projectId: string) {
  areChannelsLoading.value[projectId] = true
  try {
    const channels = await api.get<ChannelWithProject[]>('/channels', {
      params: { projectId }
    })
    projectChannels.value[projectId] = channels
  } catch (e) {
    console.error('Failed to fetch channels for project', projectId, e)
  } finally {
    areChannelsLoading.value[projectId] = false
  }
}

function getChannelLink(projectId: string, channelId: string) {
  return `/projects/${projectId}/posts?channelId=${channelId}`
}
</script>

<template>
  <nav class="flex flex-col gap-1 h-full">
    <!-- Main Items (Dashboard, Channels) -->
    <NuxtLink
      v-for="item in mainNavItems"
      :key="item.to"
      :to="item.to"
      class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
      active-class="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 !text-primary-700 dark:!text-primary-300"
    >
      <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
      <span>{{ item.label }}</span>
    </NuxtLink>

    <!-- Projects Header -->
    <NuxtLink 
      to="/projects"
      class="mt-4 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
    >
      {{ t('navigation.projects') }}
    </NuxtLink>

    <!-- Projects List -->
    <div class="flex-1 overflow-y-auto space-y-1 min-h-0">
      <div v-if="isProjectsLoading" class="px-3 py-2 text-sm text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin inline mr-2" />
        {{ t('common.loading') }}
      </div>
      
      <template v-else>
        <div v-for="project in projects" :key="project.id" class="space-y-1">
          <!-- Project Item -->
          <div 
            class="group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            :class="{ 'bg-gray-100 dark:bg-gray-800': expandedProjects.has(project.id) || route.path.includes(`/projects/${project.id}`) }"
          > 
            <NuxtLink 
              :to="`/projects/${project.id}`"
              class="flex items-center gap-3 flex-1 min-w-0"
            >
              <UIcon name="i-heroicons-briefcase" class="w-5 h-5 shrink-0" />
              <span class="truncate">{{ project.name }}</span>
            </NuxtLink>
            
            <button
              class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              @click.stop="toggleProject(project.id)"
            >
              <UIcon 
                name="i-heroicons-chevron-right" 
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-90': expandedProjects.has(project.id) }"
              />
            </button>
          </div>

          <!-- Channels List (Horizontal Icons) -->
          <div 
            v-if="expandedProjects.has(project.id)"
            class="pl-4 px-3 py-2"
          >
            <div v-if="areChannelsLoading[project.id]" class="text-xs text-gray-500">
              {{ t('common.loading') }}...
            </div>
            
            <div v-else-if="projectChannels[project.id]?.length" class="flex items-center gap-2 flex-wrap">
              <UTooltip
                v-for="channel in projectChannels[project.id]"
                :key="channel.id"
                :text="channel.name"
              >
                <NuxtLink
                  :to="getChannelLink(project.id, channel.id)"
                  class="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                  :class="{ 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500': route.query.channelId === channel.id }"
                >
                  <UIcon 
                    v-if="channel.socialMedia === 'TELEGRAM'" 
                    name="i-simple-icons-telegram" 
                    class="w-5 h-5 text-blue-500" 
                  />
                  <UIcon 
                    v-else-if="channel.socialMedia === 'INSTAGRAM'" 
                    name="i-simple-icons-instagram" 
                    class="w-5 h-5 text-pink-600" 
                  />
                  <UIcon 
                    v-else-if="channel.socialMedia === 'FACEBOOK'" 
                    name="i-simple-icons-facebook" 
                    class="w-5 h-5 text-blue-600" 
                  />
                  <UIcon 
                    v-else-if="channel.socialMedia === 'X'" 
                    name="i-simple-icons-x" 
                    class="w-5 h-5 text-gray-900 dark:text-white" 
                  />
                  <UIcon 
                    v-else-if="channel.socialMedia === 'YOUTUBE'" 
                    name="i-simple-icons-youtube" 
                    class="w-5 h-5 text-red-600" 
                  />
                  <UIcon 
                    v-else-if="channel.socialMedia === 'VK'" 
                    name="i-simple-icons-vk" 
                    class="w-5 h-5 text-blue-700" 
                  />
                  <UIcon 
                    v-else-if="channel.socialMedia === 'TIKTOK'" 
                    name="i-simple-icons-tiktok" 
                    class="w-5 h-5 text-gray-900 dark:text-white" 
                  />
                  <UIcon 
                    v-else-if="channel.socialMedia === 'LINKEDIN'" 
                    name="i-simple-icons-linkedin" 
                    class="w-5 h-5 text-blue-700" 
                  />
                  <UIcon 
                    v-else 
                    name="i-heroicons-globe-alt" 
                    class="w-5 h-5 text-gray-500" 
                  />
                </NuxtLink>
              </UTooltip>
            </div>
            
            <div v-else class="text-xs text-gray-400 italic">
              {{ t('channel.noChannelsFound') }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Bottom Items -->
    <div class="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
      <NuxtLink
        v-for="item in visibleBottomNavItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
        active-class="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 !text-primary-700 dark:!text-primary-300"
      >
        <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
