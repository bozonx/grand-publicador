import type { Database } from '~/types/database.types'

type Blog = Database['public']['Tables']['blogs']['Row']
type BlogInsert = Database['public']['Tables']['blogs']['Insert']
type BlogUpdate = Database['public']['Tables']['blogs']['Update']
type BlogMember = Database['public']['Tables']['blog_members']['Row']
type BlogRole = Database['public']['Enums']['blog_role']

/**
 * Extended blog type with owner information
 */
export interface BlogWithOwner extends Blog {
  owner?: {
    id: string
    full_name: string | null
    username: string | null
  } | null
}

/**
 * Extended blog type with member role (for current user)
 */
export interface BlogWithRole extends BlogWithOwner {
  role?: BlogRole
  memberCount?: number
  channelCount?: number
  postCount?: number
}

/**
 * Extended blog member type with user details
 */
export interface BlogMemberWithUser extends BlogMember {
  user: {
    id: string
    full_name: string | null
    username: string | null
    email: string | null
    avatar_url: string | null
  }
}

/**
 * Composable for managing blogs
 * Provides CRUD operations and role-based access control
 */
export function useBlogs() {
  const supabase = useSupabaseClient<Database>()
  const { user } = useAuth()
  const { t } = useI18n()
  const toast = useToast()

  const blogs = ref<BlogWithRole[]>([])
  const currentBlog = ref<BlogWithRole | null>(null)
  const members = ref<BlogMemberWithUser[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all blogs where user is a member or owner
   */
  async function fetchBlogs(): Promise<BlogWithRole[]> {
    if (!user.value?.id) {
      error.value = 'User not authenticated'
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      // Get all blog memberships for current user
      const { data: memberships, error: membershipError } = await supabase
        .from('blog_members')
        .select('blog_id, role')
        .eq('user_id', user.value.id)

      if (membershipError) throw membershipError

      // Get blogs where user is member or owner
      const { data: ownedBlogs, error: ownedError } = await supabase
        .from('blogs')
        .select(`
          *,
          owner:users!blogs_owner_id_fkey(id, full_name, username)
        `)
        .eq('owner_id', user.value.id)

      if (ownedError) throw ownedError

      // Get blogs where user is member (but not owner)
      const memberBlogIds = memberships
        ?.filter(m => !ownedBlogs?.find(b => b.id === m.blog_id))
        .map(m => m.blog_id) || []

      let memberBlogs: BlogWithOwner[] = []
      if (memberBlogIds.length > 0) {
        const { data, error: memberError } = await supabase
          .from('blogs')
          .select(`
            *,
            owner:users!blogs_owner_id_fkey(id, full_name, username)
          `)
          .in('id', memberBlogIds)

        if (memberError) throw memberError
        memberBlogs = data || []
      }

      // Combine and add role information
      const allBlogs = [...(ownedBlogs || []), ...memberBlogs]
      const blogsWithRoles: BlogWithRole[] = allBlogs.map(blog => {
        const membership = memberships?.find(m => m.blog_id === blog.id)
        const isOwner = blog.owner_id === user.value?.id
        return {
          ...blog,
          role: isOwner ? 'owner' : membership?.role || 'viewer'
        }
      })

      // Sort by created_at desc
      blogsWithRoles.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )

      blogs.value = blogsWithRoles
      return blogsWithRoles
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch blogs'
      error.value = message
      console.error('[useBlogs] fetchBlogs error:', err)
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single blog by ID with extended information
   */
  async function fetchBlog(blogId: string): Promise<BlogWithRole | null> {
    if (!user.value?.id) {
      error.value = 'User not authenticated'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      // Fetch blog with owner info
      const { data: blog, error: blogError } = await supabase
        .from('blogs')
        .select(`
          *,
          owner:users!blogs_owner_id_fkey(id, full_name, username)
        `)
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

      // Get counts
      const [memberCountResult, channelCountResult] = await Promise.all([
        supabase
          .from('blog_members')
          .select('id', { count: 'exact', head: true })
          .eq('blog_id', blogId),
        supabase
          .from('channels')
          .select('id', { count: 'exact', head: true })
          .eq('blog_id', blogId)
      ])

      const isOwner = blog.owner_id === user.value?.id
      const blogWithRole: BlogWithRole = {
        ...blog,
        role: isOwner ? 'owner' : membership?.role || 'viewer',
        memberCount: memberCountResult.count || 0,
        channelCount: channelCountResult.count || 0
      }

      currentBlog.value = blogWithRole
      return blogWithRole
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch blog'
      error.value = message
      console.error('[useBlogs] fetchBlog error:', err)
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new blog
   * Automatically sets current user as owner and creates owner membership
   */
  async function createBlog(data: { name: string; description?: string }): Promise<Blog | null> {
    if (!user.value?.id) {
      error.value = 'User not authenticated'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      const blogData: BlogInsert = {
        name: data.name,
        description: data.description || null,
        owner_id: user.value.id
      }

      const { data: blog, error: createError } = await supabase
        .from('blogs')
        .insert(blogData)
        .select()
        .single()

      if (createError) throw createError

      // Create owner membership
      const { error: memberError } = await supabase
        .from('blog_members')
        .insert({
          blog_id: blog.id,
          user_id: user.value.id,
          role: 'owner'
        })

      if (memberError) {
        console.error('[useBlogs] Failed to create owner membership:', memberError)
        // Don't throw - blog was created successfully
      }

      toast.add({
        title: t('common.success'),
        description: t('blog.createSuccess', 'Blog created successfully'),
        color: 'success'
      })

      // Refresh blogs list
      await fetchBlogs()

      return blog
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create blog'
      error.value = message
      console.error('[useBlogs] createBlog error:', err)
      toast.add({
        title: t('common.error'),
        description: message,
        color: 'error'
      })
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Update an existing blog
   * Only owners and admins can update
   */
  async function updateBlog(blogId: string, data: BlogUpdate): Promise<Blog | null> {
    if (!user.value?.id) {
      error.value = 'User not authenticated'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      // Check permission
      const blog = currentBlog.value || blogs.value.find(b => b.id === blogId)
      if (blog && !canEdit(blog)) {
        throw new Error('Permission denied: You cannot edit this blog')
      }

      const { data: updatedBlog, error: updateError } = await supabase
        .from('blogs')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', blogId)
        .select()
        .single()

      if (updateError) throw updateError

      toast.add({
        title: t('common.success'),
        description: t('blog.updateSuccess', 'Blog updated successfully'),
        color: 'success'
      })

      // Update local state
      if (currentBlog.value?.id === blogId) {
        currentBlog.value = { ...currentBlog.value, ...updatedBlog }
      }
      
      const index = blogs.value.findIndex(b => b.id === blogId)
      if (index !== -1) {
        blogs.value[index] = { ...blogs.value[index], ...updatedBlog }
      }

      return updatedBlog
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update blog'
      error.value = message
      console.error('[useBlogs] updateBlog error:', err)
      toast.add({
        title: t('common.error'),
        description: message,
        color: 'error'
      })
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a blog
   * Only owners can delete
   */
  async function deleteBlog(blogId: string): Promise<boolean> {
    if (!user.value?.id) {
      error.value = 'User not authenticated'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      // Check permission
      const blog = currentBlog.value || blogs.value.find(b => b.id === blogId)
      if (blog && !canDelete(blog)) {
        throw new Error('Permission denied: Only the owner can delete this blog')
      }

      const { error: deleteError } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blogId)

      if (deleteError) throw deleteError

      toast.add({
        title: t('common.success'),
        description: t('blog.deleteSuccess', 'Blog deleted successfully'),
        color: 'success'
      })

      // Update local state
      blogs.value = blogs.value.filter(b => b.id !== blogId)
      if (currentBlog.value?.id === blogId) {
        currentBlog.value = null
      }

      return true
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete blog'
      error.value = message
      console.error('[useBlogs] deleteBlog error:', err)
      toast.add({
        title: t('common.error'),
        description: message,
        color: 'error'
      })
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch members for a blog
   */
  async function fetchMembers(blogId: string): Promise<BlogMemberWithUser[]> {
    if (!user.value?.id) return []

    isLoading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('blog_members')
        .select(`
          *,
          user:users!blog_members_user_id_fkey(id, full_name, username, email, avatar_url)
        `)
        .eq('blog_id', blogId)
        .order('role', { ascending: true }) // owner, admin, editor, viewer (based on enum usually, but lets see)

      if (fetchError) throw fetchError

      // Cast to correct type since we know the join structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const membersData = data as any[] as BlogMemberWithUser[]
      members.value = membersData
      return membersData
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch members'
      console.error('[useBlogs] fetchMembers error:', err)
      // Don't set global error for background fetch ideally, but for now ok
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Add a member to the blog
   */
  async function addMember(blogId: string, emailOrUsername: string, role: BlogRole): Promise<boolean> {
    if (!currentBlog.value || !canManageMembers(currentBlog.value)) {
      error.value = 'Permission denied'
      return false
    }

    isLoading.value = true
    
    try {
      // 1. Find user by email or username
      // Note: This relies on public.users table being up to date
      const { data: foundUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
        .single()

      if (userError || !foundUser) {
        throw new Error(t('errors.userNotFound'))
      }

      // 2. Check if already a member
      const { data: existingMember } = await supabase
        .from('blog_members')
        .select('id')
        .eq('blog_id', blogId)
        .eq('user_id', foundUser.id)
        .single()

      if (existingMember) {
        throw new Error(t('errors.userAlreadyMember'))
      }

      // 3. Add member
      const { error: insertError } = await supabase
        .from('blog_members')
        .insert({
          blog_id: blogId,
          user_id: foundUser.id,
          role: role
        })

      if (insertError) throw insertError

      toast.add({
        title: t('common.success'),
        description: t('blogMember.addSuccess'),
        color: 'success'
      })

      // Refresh members
      await fetchMembers(blogId)
      return true
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add member'
      console.error('[useBlogs] addMember error:', err)
      toast.add({
        title: t('common.error'),
        description: message,
        color: 'error'
      })
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Upgrade/Downgrade member role
   */
  async function updateMemberRole(blogId: string, userId: string, newRole: BlogRole): Promise<boolean> {
    if (!currentBlog.value || !canManageMembers(currentBlog.value)) return false

    isLoading.value = true

    try {
      const { error: updateError } = await supabase
        .from('blog_members')
        .update({ role: newRole })
        .eq('blog_id', blogId)
        .eq('user_id', userId)

      if (updateError) throw updateError

      toast.add({
        title: t('common.success'),
        description: t('blogMember.updateSuccess'),
        color: 'success'
      })

      // Update local state
      const member = members.value.find(m => m.user_id === userId)
      if (member) {
        member.role = newRole
      }
      return true
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update member'
      toast.add({
        title: t('common.error'),
        description: message,
        color: 'error'
      })
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Remove member from blog
   */
  async function removeMember(blogId: string, userId: string): Promise<boolean> {
    if (!currentBlog.value || !canManageMembers(currentBlog.value)) return false

    // Prevent removing self if owner
    if (userId === currentBlog.value.owner_id) {
       toast.add({ description: 'Cannot remove owner', color: 'error' })
       return false
    }

    isLoading.value = true

    try {
      const { error: deleteError } = await supabase
        .from('blog_members')
        .delete()
        .eq('blog_id', blogId)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      toast.add({
        title: t('common.success'),
        description: t('blogMember.removeSuccess'),
        color: 'success'
      })

      // Update local state
      members.value = members.value.filter(m => m.user_id !== userId)
      return true
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove member'
      toast.add({
        title: t('common.error'),
        description: message,
        color: 'error'
      })
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Check if current user can edit the blog (owner or admin)
   */
  function canEdit(blog: BlogWithRole): boolean {
    if (!user.value?.id) return false
    return blog.owner_id === user.value.id || 
           blog.role === 'owner' || 
           blog.role === 'admin'
  }

  /**
   * Check if current user can delete the blog (only owner)
   */
  function canDelete(blog: BlogWithRole): boolean {
    if (!user.value?.id) return false
    return blog.owner_id === user.value.id || blog.role === 'owner'
  }

  /**
   * Check if current user can manage members (owner or admin)
   */
  function canManageMembers(blog: BlogWithRole): boolean {
    return canEdit(blog)
  }

  /**
   * Get role display name
   */
  function getRoleDisplayName(role: BlogRole | undefined): string {
    if (!role) return t('roles.viewer')
    return t(`roles.${role}`)
  }

  /**
   * Clear current blog state
   */
  function clearCurrentBlog() {
    currentBlog.value = null
    error.value = null
  }

  return {
    // State
    blogs,
    currentBlog,
    members,
    isLoading,
    error,

    // Methods
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

    // Permission helpers
    canEdit,
    canDelete,
    canManageMembers,
    getRoleDisplayName
  }
}
