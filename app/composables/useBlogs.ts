
import type { Database } from '~/types/database.types'
import { useBlogsStore } from '~/stores/blogs'
import type { BlogWithRole, BlogMemberWithUser, BlogWithOwner } from '~/stores/blogs'
import { formatError } from '~/utils/error'

type Blog = Database['public']['Tables']['blogs']['Row']
type BlogInsert = Database['public']['Tables']['blogs']['Insert']
type BlogUpdate = Database['public']['Tables']['blogs']['Update']
type BlogRole = Database['public']['Enums']['blog_role']


/**
 * Composable for managing blogs
 * Provides CRUD operations and role-based access control
 */
export function useBlogs() {
  const supabase = useSupabaseClient<Database>()
  const { user } = useAuth()
  const { t } = useI18n()
  const toast = useToast()

  const store = useBlogsStore()
  const { blogs, currentBlog, members, isLoading, error } = storeToRefs(store)

  /**
   * Fetch all blogs where user is a member or owner
   * Optimized to use SQL filtering via memberships
   */
  async function fetchBlogs(): Promise<BlogWithRole[]> {
    if (!user.value?.id) {
      return []
    }

    store.setLoading(true)
    store.setError(null)

    try {
      // 1. Get all blog memberships for current user
      const { data: memberships, error: membershipError } = await supabase
        .from('blog_members')
        .select('blog_id, role')
        .eq('user_id', user.value.id)

      if (membershipError) throw membershipError

      if (!memberships || memberships.length === 0) {
        store.setBlogs([])
        return []
      }

      const blogIds = memberships.map((m) => m.blog_id)

      // 2. Get blogs details
      const { data: blogsData, error: blogsError } = await supabase
        .from('blogs')
        .select(
          `
          *,
          owner:users!blogs_owner_id_fkey(id, full_name, username)
        `
        )
        .in('id', blogIds)
        .order('created_at', { ascending: false })

      if (blogsError) throw blogsError

      // 3. Merge role information
      const blogsWithRoles: BlogWithRole[] = (blogsData || []).map((blog) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b = blog as any
        const membership = memberships.find((m) => m.blog_id === b.id)
        const isOwner = b.owner_id === user.value?.id
        return {
          ...b,
          role: isOwner ? 'owner' : membership?.role || 'viewer',
        }
      })

      store.setBlogs(blogsWithRoles)
      return blogsWithRoles
    } catch (err) {
      const message = formatError(err)
      store.setError(message)
      console.error('[useBlogs] fetchBlogs error:', err)
      toast.add({
        title: t('common.error'),
        description: t('errors.fetchBlogsFailed', 'Failed to fetch blogs'), // Fallback if key missing
        color: 'error',
      })
      return []
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Fetch a single blog by ID with extended information
   */
  async function fetchBlog(blogId: string): Promise<BlogWithRole | null> {
    if (!user.value?.id) {
      return null
    }

    store.setLoading(true)
    store.setError(null)

    try {
      // Fetch blog with owner info
      const { data: blog, error: blogError } = await supabase
        .from('blogs')
        .select(
          `
          *,
          owner:users!blogs_owner_id_fkey(id, full_name, username)
        `
        )
        .eq('id', blogId)
        .single()

      if (blogError) throw blogError

      // Get user's role in this blog
      const { data: membership } = await supabase
        .from('blog_members')
        .select('role')
        .eq('blog_id', blogId)
        .eq('user_id', user.value.id)
        .single()

      // Get counts using nested select on related tables if possible, 
      // but strictly adhering to "optimization" request, separate count queries are N+3 for single item 
      // which is acceptable, OR use nested select count if relationship setup allows.
      // We will perform parallel requests for counts as in original to ensure correctness without risking relationship names.
      const [memberCountResult, channelCountResult, postCountResult] = await Promise.all([
        supabase.from('blog_members').select('id', { count: 'exact', head: true }).eq('blog_id', blogId),
        supabase.from('channels').select('id', { count: 'exact', head: true }).eq('blog_id', blogId),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('blog_id', blogId),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b = blog as any
      const isOwner = b.owner_id === user.value?.id
      const blogWithRole: BlogWithRole = {
        ...b,
        role: isOwner ? 'owner' : membership?.role || 'viewer',
        memberCount: memberCountResult.count || 0,
        channelCount: channelCountResult.count || 0,
        postCount: postCountResult.count || 0,
      }

      store.setCurrentBlog(blogWithRole)
      return blogWithRole
    } catch (err) {
      const message = formatError(err)
      store.setError(message)
      console.error('[useBlogs] fetchBlog error:', err)
      toast.add({
        title: t('common.error'),
        description: t('errors.notFound'),
        color: 'error',
      })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Create a new blog
   */
  async function createBlog(data: { name: string; description?: string }): Promise<Blog | null> {
    if (!user.value?.id) return null

    store.setLoading(true)
    store.setError(null)

    try {
      const blogData: BlogInsert = {
        name: data.name,
        description: data.description || null,
        owner_id: user.value.id,
      }

      const { data: blog, error: createError } = await supabase
        .from('blogs')
        .insert(blogData)
        .select()
        .single()

      if (createError) throw createError

      // Note: Trigger usually handles 'owner' role creation for owner_id.
      // If manual insertion is needed:
      const { error: memberError } = await supabase.from('blog_members').insert({
        blog_id: blog.id,
        user_id: user.value.id,
        role: 'owner',
      })
      
      if (memberError) {
         // Ignore duplicate error if trigger did it
         if (memberError.code !== '23505') {
            console.error('[useBlogs] Failed to create owner membership:', memberError)
         }
      }

      toast.add({
        title: t('common.success'),
        description: t('blog.createSuccess'),
        color: 'success',
      })

      // Refresh blogs
      await fetchBlogs()

      return blog
    } catch (err) {
      const message = formatError(err)
      store.setError(message)
      console.error('[useBlogs] createBlog error:', err)
      toast.add({
        title: t('common.error'),
        description: t('errors.createBlogFailed', 'Failed to create blog'),
        color: 'error',
      })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Update an existing blog
   */
  async function updateBlog(blogId: string, data: BlogUpdate): Promise<Blog | null> {
    if (!user.value?.id) return null

    store.setLoading(true)
    store.setError(null)

    try {
      const blog = currentBlog.value || blogs.value.find((b: BlogWithRole) => b.id === blogId)
      if (blog && !canEdit(blog)) {
         throw new Error(t('auth.accessDenied'))
      }

      const { data: updatedBlog, error: updateError } = await supabase
        .from('blogs')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', blogId)
        .select()
        .single()

      if (updateError) throw updateError

      toast.add({
        title: t('common.success'),
        description: t('blog.updateSuccess'),
        color: 'success',
      })

      store.updateBlog(blogId, updatedBlog as BlogWithRole)

      return updatedBlog
    } catch (err) {
      const message = formatError(err)
      store.setError(message)
      console.error('[useBlogs] updateBlog error:', err)
      toast.add({
        title: t('common.error'),
        description: t('errors.updateBlogFailed', 'Failed to update blog'),
        color: 'error',
      })
      return null
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Delete a blog
   */
  async function deleteBlog(blogId: string): Promise<boolean> {
    if (!user.value?.id) return false

    store.setLoading(true)
    store.setError(null)

    try {
      const blog = currentBlog.value || blogs.value.find((b: BlogWithRole) => b.id === blogId)
      if (blog && !canDelete(blog)) {
        throw new Error(t('auth.accessDenied'))
      }

      const { error: deleteError } = await supabase.from('blogs').delete().eq('id', blogId)

      if (deleteError) throw deleteError

      toast.add({
        title: t('common.success'),
        description: t('blog.deleteSuccess'),
        color: 'success',
      })

      store.removeBlog(blogId)
      return true
    } catch (err) {
      const message = formatError(err)
      store.setError(message)
      console.error('[useBlogs] deleteBlog error:', err)
      toast.add({
        title: t('common.error'),
        description: t('errors.deleteBlogFailed', 'Failed to delete blog'),
        color: 'error',
      })
      return false
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Fetch members for a blog
   */
  async function fetchMembers(blogId: string): Promise<BlogMemberWithUser[]> {
    if (!user.value?.id) return []

    store.setLoading(true)
    store.setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('blog_members')
        .select(
          `
          *,
          user:users!blog_members_user_id_fkey(id, full_name, username, email, avatar_url)
        `
        )
        .eq('blog_id', blogId)
        .order('role', { ascending: true })

      if (fetchError) throw fetchError

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const membersData = data as any[] as BlogMemberWithUser[]
      store.setMembers(membersData)
      return membersData
    } catch (err) {
      const message = formatError(err)
      console.error('[useBlogs] fetchMembers error:', err)
      // Don't set global error for background fetch
      return []
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Add a member to the blog
   */
  async function addMember(
    blogId: string,
    emailOrUsername: string,
    role: BlogRole
  ): Promise<boolean> {
    if (!currentBlog.value || !canManageMembers(currentBlog.value)) {
      store.setError(t('auth.accessDenied'))
      return false
    }

    store.setLoading(true)

    try {
      // 1. Find user by email or username
      const { data: foundUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
        .single()

      if (userError || !foundUser) {
        throw new Error(t('errors.userNotFound'))
      }

      // 2. Add member (Handle conflict directly)
      const { error: insertError } = await supabase.from('blog_members').insert({
        blog_id: blogId,
        user_id: foundUser.id,
        role: role,
      })

      if (insertError) {
        // Unique violation code
        if (insertError.code === '23505') {
            throw new Error(t('errors.userAlreadyMember'))
        }
        throw insertError
      }

      toast.add({
        title: t('common.success'),
        description: t('blogMember.addSuccess'),
        color: 'success',
      })

      await fetchMembers(blogId)
      return true
    } catch (err) {
      const message = formatError(err)
      console.error('[useBlogs] addMember error:', err)
      toast.add({
        title: t('common.error'),
        description: message,
        color: 'error',
      })
      return false
    } finally {
      store.setLoading(false)
    }
  }

  // ... (updateMemberRole and removeMember similarly updated to use store)
  
  async function updateMemberRole(blogId: string, userId: string, newRole: BlogRole): Promise<boolean> {
     // ... logic from original but using store logic
     if (!currentBlog.value || !canManageMembers(currentBlog.value)) return false
     store.setLoading(true)
     try {
        const { error: updateError } = await supabase.from('blog_members').update({ role: newRole }).eq('blog_id', blogId).eq('user_id', userId)
        if (updateError) throw updateError
        
        toast.add({ title: t('common.success'), description: t('blogMember.updateSuccess'), color: 'success' })
        
        // Update local state by refetching or simple mutation
        const member = members.value.find((m: BlogMemberWithUser) => m.user_id === userId)
        if (member) member.role = newRole
        
        return true
     } catch (err) {
        toast.add({ title: t('common.error'), description: formatError(err), color: 'error' })
        return false
     } finally {
        store.setLoading(false)
     }
  }

  async function removeMember(blogId: string, userId: string): Promise<boolean> {
     if (!currentBlog.value || !canManageMembers(currentBlog.value)) return false
     if (userId === currentBlog.value.owner_id) {
        toast.add({ description: t('blogMember.cannotRemoveOwner'), color: 'error' })
        return false
     }
     store.setLoading(true)
     try {
        const { error: deleteError } = await supabase.from('blog_members').delete().eq('blog_id', blogId).eq('user_id', userId)
        if (deleteError) throw deleteError
        
        toast.add({ title: t('common.success'), description: t('blogMember.removeSuccess'), color: 'success' })
        store.setMembers(members.value.filter((m: BlogMemberWithUser) => m.user_id !== userId))
        return true
     } catch (err) {
        toast.add({ title: t('common.error'), description: formatError(err), color: 'error' })
        return false
     } finally {
        store.setLoading(false)
     }
  }

  /**
   * Check if current user can edit the blog (owner or admin)
   */
  function canEdit(blog: BlogWithRole): boolean {
    if (!user.value?.id) return false
    return blog.owner_id === user.value.id || blog.role === 'owner' || blog.role === 'admin'
  }

  function canDelete(blog: BlogWithRole): boolean {
    if (!user.value?.id) return false
    return blog.owner_id === user.value.id || blog.role === 'owner'
  }

  function canManageMembers(blog: BlogWithRole): boolean {
    return canEdit(blog)
  }

  function getRoleDisplayName(role: BlogRole | undefined): string {
    if (!role) return t('roles.viewer')
    return t(`roles.${role}`)
  }

  function clearCurrentBlog() {
    store.setCurrentBlog(null)
    store.setError(null)
  }

  return {
    blogs,
    currentBlog,
    members,
    isLoading,
    error,
    fetchBlogs,
    fetchBlog,
    createBlog,
    updateBlog,
    deleteBlog,
    clearCurrentBlog,
    fetchMembers,
    addMember,
    updateMemberRole,
    removeMember,
    canEdit,
    canDelete,
    canManageMembers,
    getRoleDisplayName,
  }
}
