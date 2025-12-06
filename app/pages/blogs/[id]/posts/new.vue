<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { fetchBlog, currentBlog } = useBlogs()

const blogId = computed(() => route.params.id as string)

onMounted(() => {
  if (blogId.value && (!currentBlog.value || currentBlog.value.id !== blogId.value)) {
    fetchBlog(blogId.value)
  }
})

/**
 * Handle successful post creation
 */
function handleSuccess(postId: string) {
  router.push(`/blogs/${blogId.value}/posts/${postId}`)
}

/**
 * Handle cancel
 */
function handleCancel() {
  router.push(`/blogs/${blogId.value}/posts`)
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Back button -->
    <div class="mb-6">
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-heroicons-arrow-left"
        class="-ml-2.5"
        @click="handleCancel"
      >
        <span class="flex items-center gap-1">
          {{ t('common.back') }}
          <span v-if="currentBlog" class="text-gray-500 font-normal">
            to {{ currentBlog.name }}
          </span>
        </span>
      </UButton>
    </div>

    <!-- Post form -->
    <FormsPostForm :blog-id="blogId" @success="handleSuccess" @cancel="handleCancel" />
  </div>
</template>
