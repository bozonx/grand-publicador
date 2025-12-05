-- Migration: Fix schema to match PRD requirements and optimize structure
-- This migration fixes several issues:
-- 1. Add 'admin' role to blog_role enum
-- 2. Expand social_media_enum to include all platforms
-- 3. Fix post_type_enum to match PRD
-- 4. Add missing fields to posts table
-- 5. Change posts to reference channel_id instead of blog_id
-- 6. Remove FK constraint on users.id to support hybrid auth (Telegram + Browser)
-- 7. Add missing RLS policies

-- ============================================
-- 1. FIX USERS TABLE FOR HYBRID AUTH
-- ============================================

-- Drop the FK constraint to auth.users to allow standalone user creation
-- This enables hybrid auth: Telegram users + regular browser users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Make email optional for Telegram-only users
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Add username field for Telegram users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;

-- ============================================
-- 2. FIX BLOG_ROLE ENUM - Add 'admin' role
-- ============================================

-- PostgreSQL doesn't allow direct enum modification, so we need to:
-- 1. Create new enum
-- 2. Update column to use new enum
-- 3. Drop old enum

ALTER TYPE blog_role RENAME TO blog_role_old;

CREATE TYPE blog_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Drop default before changing type to avoid cast issues
ALTER TABLE public.blog_members ALTER COLUMN role DROP DEFAULT;

-- Update blog_members to use new enum
ALTER TABLE public.blog_members 
    ALTER COLUMN role TYPE blog_role 
    USING role::text::blog_role;

-- Restore default value
ALTER TABLE public.blog_members ALTER COLUMN role SET DEFAULT 'viewer'::blog_role;

DROP TYPE blog_role_old;

-- ============================================
-- 3. FIX SOCIAL_MEDIA_ENUM - Add all platforms
-- ============================================

ALTER TYPE social_media_enum RENAME TO social_media_enum_old;

CREATE TYPE social_media_enum AS ENUM (
    'telegram',
    'instagram', 
    'vk',
    'youtube',
    'tiktok',
    'x',
    'facebook',
    'site'
);

ALTER TABLE public.channels 
    ALTER COLUMN platform TYPE social_media_enum 
    USING platform::text::social_media_enum;

DROP TYPE social_media_enum_old;

-- Rename 'platform' to 'social_media' and 'identifier' to 'channel_identifier' for PRD consistency
ALTER TABLE public.channels RENAME COLUMN platform TO social_media;
ALTER TABLE public.channels RENAME COLUMN identifier TO channel_identifier;

-- ============================================
-- 4. FIX POST_TYPE_ENUM - Match PRD values
-- ============================================

ALTER TYPE post_type_enum RENAME TO post_type_enum_old;

CREATE TYPE post_type_enum AS ENUM ('post', 'article', 'news', 'video', 'short');

-- We'll handle this after restructuring posts table
DROP TYPE post_type_enum_old;

-- ============================================
-- 5. RESTRUCTURE POSTS TABLE
-- ============================================

-- Drop old posts table and recreate with correct structure
-- First, backup any existing data (in production, you'd migrate data)
DROP TABLE IF EXISTS public.posts CASCADE;

CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Required fields
    content TEXT NOT NULL,
    social_media social_media_enum NOT NULL,
    post_type post_type_enum NOT NULL,
    
    -- Optional fields
    title TEXT,
    description TEXT,
    author_comment TEXT,
    tags TEXT[],
    post_date TIMESTAMPTZ,
    
    -- Status and scheduling
    status post_status_enum DEFAULT 'draft'::post_status_enum,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    
    -- Metadata
    meta JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for posts
CREATE INDEX idx_posts_channel_id ON public.posts(channel_id);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_social_media ON public.posts(social_media);
CREATE INDEX idx_posts_post_type ON public.posts(post_type);

-- ============================================
-- 6. REMOVE SLUG FROM BLOGS (not in PRD)
-- ============================================

ALTER TABLE public.blogs DROP COLUMN IF EXISTS slug;

-- ============================================
-- 7. ADD UPDATED_AT TRIGGER FOR POSTS
-- ============================================

CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON public.posts 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 8. ENABLE RLS ON POSTS
-- ============================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. ADD MISSING RLS POLICIES
-- ============================================

-- Posts: SELECT - Members can view posts of channels in their blogs
CREATE POLICY "Members can view posts of their blog channels" 
    ON public.posts FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.channels c
            JOIN public.blog_members bm ON bm.blog_id = c.blog_id
            WHERE c.id = posts.channel_id 
            AND bm.user_id = auth.uid()
        )
    );

-- Posts: INSERT - Editors, Admins, Owners can create posts
CREATE POLICY "Editors and above can create posts" 
    ON public.posts FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.channels c
            JOIN public.blog_members bm ON bm.blog_id = c.blog_id
            WHERE c.id = posts.channel_id 
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin', 'editor')
        )
    );

-- Posts: UPDATE - Author or Admins/Owners can update
CREATE POLICY "Authors and admins can update posts" 
    ON public.posts FOR UPDATE 
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.channels c
            JOIN public.blog_members bm ON bm.blog_id = c.blog_id
            WHERE c.id = posts.channel_id 
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin')
        )
    );

-- Posts: DELETE - Only Admins/Owners can delete
CREATE POLICY "Admins and owners can delete posts" 
    ON public.posts FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.channels c
            JOIN public.blog_members bm ON bm.blog_id = c.blog_id
            WHERE c.id = posts.channel_id 
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin')
        )
    );

-- Blog Members: INSERT - Only Owner/Admin can add members
CREATE POLICY "Owners and admins can add members" 
    ON public.blog_members FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.blog_members bm
            WHERE bm.blog_id = blog_members.blog_id 
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin')
        )
        OR
        -- Allow owner to add themselves when creating blog
        EXISTS (
            SELECT 1 FROM public.blogs b
            WHERE b.id = blog_members.blog_id 
            AND b.owner_id = auth.uid()
        )
    );

-- Blog Members: UPDATE - Only Owner/Admin can change roles
CREATE POLICY "Owners and admins can update member roles" 
    ON public.blog_members FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.blog_members bm
            WHERE bm.blog_id = blog_members.blog_id 
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin')
        )
    );

-- Blog Members: DELETE - Only Owner/Admin can remove members (except owner)
CREATE POLICY "Owners and admins can remove members" 
    ON public.blog_members FOR DELETE 
    USING (
        -- Cannot delete owner
        role != 'owner'
        AND EXISTS (
            SELECT 1 FROM public.blog_members bm
            WHERE bm.blog_id = blog_members.blog_id 
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin')
        )
    );

-- Channels: INSERT - Editors and above can create channels
CREATE POLICY "Editors and above can create channels" 
    ON public.channels FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.blog_members bm
            WHERE bm.blog_id = channels.blog_id 
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin', 'editor')
        )
    );

-- Channels: UPDATE - Editors and above can update channels
CREATE POLICY "Editors and above can update channels" 
    ON public.channels FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.blog_members bm
            WHERE bm.blog_id = channels.blog_id 
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin', 'editor')
        )
    );

-- Channels: DELETE - Only Owner/Admin can delete channels
CREATE POLICY "Owners and admins can delete channels" 
    ON public.channels FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.blog_members bm
            WHERE bm.blog_id = channels.blog_id 
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 10. UPDATE find_or_create_telegram_user FUNCTION
-- ============================================

-- Drop old function
DROP FUNCTION IF EXISTS public.find_or_create_telegram_user(BIGINT, TEXT, TEXT, TEXT);

-- Create improved function that works with hybrid auth
CREATE OR REPLACE FUNCTION public.find_or_create_telegram_user(
    p_telegram_id BIGINT,
    p_username TEXT DEFAULT NULL,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL
)
RETURNS public.users AS $$
DECLARE
    v_user public.users;
    v_full_name TEXT;
BEGIN
    -- Build full name
    v_full_name := COALESCE(p_first_name, '');
    IF p_last_name IS NOT NULL AND p_last_name != '' THEN
        v_full_name := v_full_name || ' ' || p_last_name;
    END IF;
    v_full_name := NULLIF(TRIM(v_full_name), '');

    -- Try to find existing user by telegram_id
    SELECT * INTO v_user FROM public.users WHERE telegram_id = p_telegram_id;
    
    IF v_user.id IS NOT NULL THEN
        -- Update user info if changed
        UPDATE public.users 
        SET 
            full_name = COALESCE(v_full_name, full_name),
            username = COALESCE(p_username, username),
            updated_at = NOW()
        WHERE telegram_id = p_telegram_id
        RETURNING * INTO v_user;
        
        RETURN v_user;
    END IF;
    
    -- Create new user (standalone, not linked to auth.users)
    INSERT INTO public.users (id, telegram_id, username, full_name, created_at, updated_at)
    VALUES (
        uuid_generate_v4(),
        p_telegram_id,
        p_username,
        v_full_name,
        NOW(),
        NOW()
    )
    RETURNING * INTO v_user;
    
    RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all (including anonymous for initial auth)
GRANT EXECUTE ON FUNCTION public.find_or_create_telegram_user TO anon, authenticated;

-- ============================================
-- 11. ADD FUNCTION FOR BROWSER AUTH (create user from auth.users)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- ============================================
-- 12. ADD POLICY FOR ANONYMOUS ACCESS TO find_or_create_telegram_user
-- ============================================

-- Allow anonymous users to insert themselves (for Telegram auth)
CREATE POLICY "Allow telegram user creation" 
    ON public.users FOR INSERT 
    WITH CHECK (
        -- Only allow if telegram_id is provided (Telegram auth)
        telegram_id IS NOT NULL
        OR
        -- Or if it's from auth trigger (browser auth)
        id = auth.uid()
    );

-- Update SELECT policy to allow users to see themselves
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view other users by telegram_id" ON public.users;

CREATE POLICY "Users can view profiles" 
    ON public.users FOR SELECT 
    USING (
        -- Can see own profile
        id = auth.uid()
        OR telegram_id IS NOT NULL
        -- Or can see other users in same blogs
        OR EXISTS (
            SELECT 1 FROM public.blog_members bm1
            JOIN public.blog_members bm2 ON bm1.blog_id = bm2.blog_id
            WHERE bm1.user_id = auth.uid() AND bm2.user_id = users.id
        )
    );
