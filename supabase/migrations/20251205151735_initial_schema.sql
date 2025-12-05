-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM Types
CREATE TYPE blog_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE social_media_enum AS ENUM ('telegram', 'instagram', 'vk');
CREATE TYPE post_type_enum AS ENUM ('text', 'photo', 'video', 'audio', 'document', 'album');
CREATE TYPE post_status_enum AS ENUM ('draft', 'scheduled', 'published', 'failed');

-- 2. Tables

-- Users Table (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blogs Table
CREATE TABLE public.blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
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
    platform social_media_enum NOT NULL,
    name TEXT NOT NULL,
    identifier TEXT NOT NULL, -- e.g. @channel_username or chat_id
    credentials JSONB DEFAULT '{}'::jsonb, -- encrypted tokens
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts Table
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT,
    content TEXT, -- HTML/Markdown content
    media_files JSONB DEFAULT '[]'::jsonb, -- Array of file URLs/metadata
    status post_status_enum DEFAULT 'draft'::post_status_enum,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Users can view their own profile" 
    ON public.users FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.users FOR UPDATE 
    USING (auth.uid() = id);

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

-- Posts Policies
CREATE POLICY "Members can view posts of their blogs" 
    ON public.posts FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.blog_members 
            WHERE blog_members.blog_id = posts.blog_id 
            AND blog_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Editors and Owners can create posts" 
    ON public.posts FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.blog_members 
            WHERE blog_members.blog_id = posts.blog_id 
            AND blog_members.user_id = auth.uid()
            AND blog_members.role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Editors and Owners can update posts" 
    ON public.posts FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.blog_members 
            WHERE blog_members.blog_id = posts.blog_id 
            AND blog_members.user_id = auth.uid()
            AND blog_members.role IN ('owner', 'editor')
        )
    );

-- 4. Triggers for updated_at

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

-- 5. Trigger for auto-creating user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
