<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const router = useRouter()
const { createBlog, isLoading } = useBlogs()

/**
 * Handle blog creation
 */
async function handleCreate(data: { name: string; description: string }) {
  const blog = await createBlog({
    name: data.name,
    description: data.description || undefined,
  })

  if (blog) {
    // Navigate to the created blog
    router.push(`/blogs/${blog.id}`)
  }
}

/**
 * Cancel and go back to blogs list
 */
function handleCancel() {
  router.push('/blogs')
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

    <!-- Create form -->
    <FormsBlogForm :is-loading="isLoading" @submit="handleCreate" @cancel="handleCancel" />
  </div>
</template>
