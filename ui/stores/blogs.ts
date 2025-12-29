import { defineStore } from 'pinia'
import { ref } from 'vue'

export type BlogRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface Blog {
  id: string
  name: string
  description: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface BlogMember {
  id: string
  blogId: string
  userId: string
  role: BlogRole
  createdAt: string
}

export interface BlogWithOwner extends Blog {
  owner?: {
    id: string
    fullName: string | null
    username: string | null
  } | null
}

export interface BlogWithRole extends BlogWithOwner {
  role?: BlogRole
  memberCount?: number
  channelCount?: number
  postCount?: number
}

export interface BlogMemberWithUser extends BlogMember {
  user: {
    id: string
    fullName: string | null
    username: string | null
    email: string | null
    avatarUrl: string | null
  }
}

export const useBlogsStore = defineStore('blogs', () => {
  const blogs = ref<BlogWithRole[]>([])
  const currentBlog = ref<BlogWithRole | null>(null)
  const members = ref<BlogMemberWithUser[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  function setBlogs(newBlogs: BlogWithRole[]) {
    blogs.value = newBlogs
  }

  function setCurrentBlog(blog: BlogWithRole | null) {
    currentBlog.value = blog
  }

  function setMembers(newMembers: BlogMemberWithUser[]) {
    members.value = newMembers
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(err: string | null) {
    error.value = err
  }

  function addBlog(blog: BlogWithRole) {
    blogs.value = [blog, ...blogs.value]
  }

  function updateBlog(blogId: string, data: Partial<BlogWithRole>) {
    const index = blogs.value.findIndex((b) => b.id === blogId)
    if (index !== -1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blogs.value[index] = { ...blogs.value[index], ...(data as any) }
    }
    if (currentBlog.value?.id === blogId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentBlog.value = { ...currentBlog.value, ...(data as any) }
    }
  }

  function removeBlog(blogId: string) {
    blogs.value = blogs.value.filter((b) => b.id !== blogId)
    if (currentBlog.value?.id === blogId) {
      currentBlog.value = null
    }
  }

  return {
    blogs,
    currentBlog,
    members,
    isLoading,
    error,
    setBlogs,
    setCurrentBlog,
    setMembers,
    setLoading,
    setError,
    addBlog,
    updateBlog,
    removeBlog,
  }
})
