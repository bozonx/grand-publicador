<script setup lang="ts">
import { usePublications } from '~/composables/usePublications'
import type { PublicationWithRelations } from '~/composables/usePublications'

import type { PublicationStatus } from '~/types/posts'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const router = useRouter()

const {
  publications,
  isLoading,
  totalCount,
  statusOptions,
  fetchUserPublications,
} = usePublications()

// Pagination state
const limit = ref(12)
const offset = ref(0)
const currentPage = computed({
  get: () => Math.floor(offset.value / limit.value) + 1,
  set: (val) => {
    offset.value = (val - 1) * limit.value
  }
})

// Filter states
const selectedStatus = ref<PublicationStatus | null>(null)
const searchQuery = ref('')

// Fetch on mount
onMounted(async () => {
    await fetchUserPublications({
        limit: limit.value,
        offset: offset.value
    })
})

// Watch filters (reset to page 1)
watch([selectedStatus], () => {
    currentPage.value = 1
    fetchUserPublications({
        status: selectedStatus.value || undefined,
        limit: limit.value,
        offset: 0
    })
})

// Watch pagination
watch(currentPage, (val) => {
    fetchUserPublications({
        status: selectedStatus.value || undefined,
        limit: limit.value,
        offset: (val - 1) * limit.value
    })
})

function goToPublication(pub: PublicationWithRelations) {
  router.push(`/projects/${pub.projectId}/publications/${pub.id}`)
}

const statusFilterOptions = computed(() => [
  { value: null, label: t('common.all') },
  ...statusOptions.value,
])

const hasActiveFilters = computed(() => {
  return selectedStatus.value || searchQuery.value
})

// Client-side search filtering (since backend doesn't support it yet for publications)
const filteredPublications = computed(() => {
    if (!searchQuery.value) return publications.value
    const q = searchQuery.value.toLowerCase()
    return publications.value.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) || 
        (p.content && p.content.toLowerCase().includes(q))
    )
})

</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('publication.titlePlural') }} ({{ totalCount }})
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('navigation.publications', 'Все публикации проекта') }}
        </p>
      </div>
    </div>

    <!-- Search and filters -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col md:flex-row gap-4">
      <div class="flex-1">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          :placeholder="t('common.search')"
          size="md"
          class="w-full"
        />
      </div>
      <div class="flex flex-col sm:flex-row gap-4">
        <USelectMenu
          v-model="selectedStatus"
          :items="statusFilterOptions"
          value-key="value"
          label-key="label"
          :placeholder="t('post.status')"
          class="w-full sm:w-48"
        />
      </div>
    </div>

    <!-- Publications list -->
    <div v-if="isLoading && publications.length === 0" class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <div v-else-if="filteredPublications.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-document-text" class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ t('publication.noPublicationsFound', 'Публикации не найдены') }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400">
          {{ hasActiveFilters ? t('post.noPostsFiltered') : t('publication.noPublicationsDescription', 'У вас еще нет созданных публикаций.') }}
        </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <PublicationsPublicationListItem
          v-for="pub in filteredPublications"
          :key="pub.id"
          :publication="pub"
          show-project-info
          @click="goToPublication"
        />
    </div>

    <!-- Pagination -->
    <div v-if="totalCount > limit" class="mt-8 flex justify-center">
      <UPagination
        v-model:model-value="currentPage"
        :total="totalCount"
        :page-count="limit"
        :prev-button="{ color: 'neutral', icon: 'i-heroicons-arrow-small-left', label: t('common.prev') }"
        :next-button="{ color: 'neutral', icon: 'i-heroicons-arrow-small-right', label: t('common.next'), trailing: true }"
      />
    </div>
  </div>
</template>
