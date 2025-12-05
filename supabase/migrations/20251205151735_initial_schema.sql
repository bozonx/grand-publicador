-- Combined Migration: Initial Schema + Telegram Auth + Fixes
-- Replaces previous 3 migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM Types
CREATE TYPE blog_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
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
CREATE TYPE post_type_enum AS ENUM ('post', 'article', 'news', 'video', 'short');
CREATE TYPE post_status_enum AS ENUM ('draft', 'scheduled', 'published', 'failed');

-- 2. Tables

-- Users Table
-- Combined from initial + telegram auth + fix schema updates
-- Note: id is not FK to auth.users to support telegram-only users
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT, -- Nullable for Telegram-only users
    full_name TEXT,
    username TEXT,
    avatar_url TEXT,
    telegram_id BIGINT UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blogs Table
CREATE TABLE public.blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Members Table
CREATE TABLE public.blog_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role blog_role DEFAULT 'viewer'::blog_role,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blog_id, user_id)
);

-- Channels Table
CREATE TABLE public.channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE NOT NULL,
    social_media social_media_enum NOT NULL,
    name TEXT NOT NULL,
    channel_identifier TEXT NOT NULL, -- e.g. @channel_username or chat_id
    credentials JSONB DEFAULT '{}'::jsonb, -- encrypted tokens
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts Table
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
    media_files JSONB DEFAULT '[]'::jsonb,
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

-- Indexes
CREATE INDEX idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX idx_posts_channel_id ON public.posts(channel_id);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_social_media ON public.posts(social_media);
CREATE INDEX idx_posts_post_type ON public.posts(post_type);

-- 3. RLS Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Users can view profiles" 
    ON public.users FOR SELECT 
    USING (
        id = auth.uid()
        OR telegram_id IS NOT NULL -- Allow viewing telegram users
        OR EXISTS (
            SELECT 1 FROM public.blog_members bm1
            JOIN public.blog_members bm2 ON bm1.blog_id = bm2.blog_id
            WHERE bm1.user_id = auth.uid() AND bm2.user_id = users.id
        )
    );

CREATE POLICY "Users can update their own profile" 
    ON public.users FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Admins can update any user" 
    ON public.users FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Allow telegram user creation" 
    ON public.users FOR INSERT 
    WITH CHECK (
        telegram_id IS NOT NULL
        OR id = auth.uid()
    );

-- Blogs Policies
CREATE POLICY "Users can view blogs they are members of" 
    ON public.blogs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.blog_members 
            WHERE blog_members.blog_id = blogs.id 
            AND blog_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their blogs" 
    ON public.blogs FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their blogs" 
    ON public.blogs FOR DELETE 
    USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create blogs" 
    ON public.blogs FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Blog Members Policies
CREATE POLICY "Members can view other members of their blogs" 
    ON public.blog_members FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.blog_members as bm
            WHERE bm.blog_id = blog_members.blog_id 
            AND bm.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can add members" 
    ON public.blog_members FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.blog_members bm
            WHERE bm.blog_id = blog_members.blog_id 
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin')
        )
        OR EXISTS ( -- Owners adding themselves
            SELECT 1 FROM public.blogs b
            WHERE b.id = blog_members.blog_id 
            AND b.owner_id = auth.uid()
        )
    );

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

CREATE POLICY "Owners and admins can remove members" 
    ON public.blog_members FOR DELETE 
    USING (
        role != 'owner'
        AND EXISTS (
            SELECT 1 FROM public.blog_members bm
            WHERE bm.blog_id = blog_members.blog_id 
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin')
        )
    );

-- Channels Policies
CREATE POLICY "Members can view channels of their blogs" 
    ON public.channels FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.blog_members 
            WHERE blog_members.blog_id = channels.blog_id 
            AND blog_members.user_id = auth.uid()
        )
    );

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

-- Posts Policies
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

-- 4. Triggers and Functions

-- Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Find or Create Telegram User
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
    v_full_name := COALESCE(p_first_name, '');
    IF p_last_name IS NOT NULL AND p_last_name != '' THEN
        v_full_name := v_full_name || ' ' || p_last_name;
    END IF;
    v_full_name := NULLIF(TRIM(v_full_name), '');

    SELECT * INTO v_user FROM public.users WHERE telegram_id = p_telegram_id;
    
    IF v_user.id IS NOT NULL THEN
        UPDATE public.users 
        SET 
            full_name = COALESCE(v_full_name, full_name),
            username = COALESCE(p_username, username),
            updated_at = NOW()
        WHERE telegram_id = p_telegram_id
        RETURNING * INTO v_user;
        RETURN v_user;
    END IF;
    
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

GRANT EXECUTE ON FUNCTION public.find_or_create_telegram_user TO anon, authenticated;

-- Browser Auth Handler
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

-- Cleanup any existing triggers on auth.users (though this is new migration starting fresh)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();
