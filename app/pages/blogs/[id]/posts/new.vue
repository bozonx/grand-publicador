<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const blogId = computed(() => route.params.id as string)

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
  <div>
    <!-- Back button -->
    <div class="mb-6">
      <UButton variant="ghost" color="neutral" icon="i-heroicons-arrow-left" @click="handleCancel">
        {{ t('common.back') }}
      </UButton>
    </div>

    <!-- Post form -->
    <FormsPostForm :blog-id="blogId" @success="handleSuccess" @cancel="handleCancel" />
  </div>
</template>
