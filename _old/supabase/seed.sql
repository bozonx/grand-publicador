-- ==============================================
-- SEED DATA FOR GRAND PUBLICADOR
-- ==============================================
-- This seed file creates test data for local development
-- It supports both Telegram and Browser authentication modes

-- ==============================================
-- 1. CREATE TEST USERS
-- ==============================================

-- Test user 1: Telegram user (simulates dev mode with VITE_DEV_TELEGRAM_ID=123456789)
INSERT INTO public.users (id, telegram_id, username, full_name, is_admin, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    123456789,
    'dev_user',
    'Dev User',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    telegram_id = EXCLUDED.telegram_id,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    is_admin = EXCLUDED.is_admin;

-- Test user 2: Browser user (for testing email/password auth)
-- Note: For browser auth, you need to create user via Supabase Auth first
-- This is just a placeholder that will be linked when user signs up
INSERT INTO public.users (id, email, full_name, is_admin, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'editor@example.com',
    'Editor User',
    false,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- Test user 3: Another Telegram user (viewer)
INSERT INTO public.users (id, telegram_id, username, full_name, is_admin, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    987654321,
    'viewer_user',
    'Viewer User',
    false,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    telegram_id = EXCLUDED.telegram_id,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name;

-- ==============================================
-- 2. CREATE TEST BLOGS
-- ==============================================

-- Blog 1: Tech Blog (owned by dev_user)
INSERT INTO public.blogs (id, name, description, owner_id, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Tech Blog',
    'A blog about technology, programming, and software development',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Blog 2: Travel Blog (owned by dev_user)
INSERT INTO public.blogs (id, name, description, owner_id, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111112',
    'Travel Adventures',
    'Sharing travel experiences and tips',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- ==============================================
-- 3. CREATE BLOG MEMBERS
-- ==============================================

-- Tech Blog members
INSERT INTO public.blog_members (blog_id, user_id, role, created_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'owner', NOW()),
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'editor', NOW()),
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003', 'viewer', NOW())
ON CONFLICT (blog_id, user_id) DO UPDATE SET
    role = EXCLUDED.role;

-- Travel Blog members
INSERT INTO public.blog_members (blog_id, user_id, role, created_at)
VALUES 
    ('11111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000001', 'owner', NOW())
ON CONFLICT (blog_id, user_id) DO UPDATE SET
    role = EXCLUDED.role;

-- ==============================================
-- 4. CREATE CHANNELS
-- ==============================================

-- Tech Blog channels
INSERT INTO public.channels (id, blog_id, social_media, name, channel_identifier, is_active, created_at, updated_at)
VALUES 
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'telegram', 'Tech News TG', '@tech_news_channel', true, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'youtube', 'Tech Tutorials', 'UCxxxxxxxx', true, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'instagram', 'Tech Tips', '@tech_tips_ig', false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    channel_identifier = EXCLUDED.channel_identifier,
    is_active = EXCLUDED.is_active;

-- Travel Blog channels
INSERT INTO public.channels (id, blog_id, social_media, name, channel_identifier, is_active, created_at, updated_at)
VALUES 
    ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111112', 'telegram', 'Travel Stories', '@travel_stories', true, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111112', 'tiktok', 'Travel Shorts', '@travel_shorts', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    channel_identifier = EXCLUDED.channel_identifier;

-- ==============================================
-- 5. CREATE POSTS
-- ==============================================

-- Posts for Tech News TG channel
INSERT INTO public.posts (id, channel_id, author_id, content, social_media, post_type, title, description, tags, status, created_at, updated_at)
VALUES 
    (
        '33333333-3333-3333-3333-333333333331',
        '22222222-2222-2222-2222-222222222221',
        '00000000-0000-0000-0000-000000000001',
        '<p>Welcome to our tech channel! 🚀</p><p>We will be sharing the latest news and tutorials about programming and technology.</p>',
        'telegram',
        'post',
        'Welcome Post',
        'Introduction to our tech channel',
        ARRAY['welcome', 'introduction', 'tech'],
        'published',
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '7 days'
    ),
    (
        '33333333-3333-3333-3333-333333333332',
        '22222222-2222-2222-2222-222222222221',
        '00000000-0000-0000-0000-000000000001',
        '<h2>Top 10 VS Code Extensions for 2025</h2><p>Here are the must-have extensions for every developer...</p>',
        'telegram',
        'article',
        'Top 10 VS Code Extensions',
        'Essential VS Code extensions for productivity',
        ARRAY['vscode', 'extensions', 'productivity', 'tools'],
        'draft',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 day'
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        '22222222-2222-2222-2222-222222222221',
        '00000000-0000-0000-0000-000000000002',
        '<p>Breaking: New JavaScript framework released! 🎉</p>',
        'telegram',
        'news',
        'New JS Framework',
        NULL,
        ARRAY['javascript', 'framework', 'news'],
        'scheduled',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    title = EXCLUDED.title,
    status = EXCLUDED.status;

-- Posts for YouTube channel
INSERT INTO public.posts (id, channel_id, author_id, content, social_media, post_type, title, description, tags, status, created_at, updated_at)
VALUES 
    (
        '33333333-3333-3333-3333-333333333334',
        '22222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000001',
        '<p>In this video, we will learn how to build a REST API with Node.js and Express.</p>',
        'youtube',
        'video',
        'Build REST API with Node.js',
        'Complete tutorial on building REST APIs',
        ARRAY['nodejs', 'express', 'api', 'tutorial'],
        'draft',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    title = EXCLUDED.title;

-- Posts for Travel channel
INSERT INTO public.posts (id, channel_id, author_id, content, social_media, post_type, title, description, author_comment, tags, status, created_at, updated_at)
VALUES 
    (
        '33333333-3333-3333-3333-333333333335',
        '22222222-2222-2222-2222-222222222224',
        '00000000-0000-0000-0000-000000000001',
        '<p>Just arrived in Tokyo! 🗼 The city is amazing...</p>',
        'telegram',
        'post',
        'Tokyo Adventures',
        'My first day in Tokyo',
        'Remember to add more photos before publishing',
        ARRAY['tokyo', 'japan', 'travel', 'asia'],
        'draft',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    title = EXCLUDED.title;

-- ==============================================
-- SEED COMPLETE
-- ==============================================
-- To test:
-- 1. Set VITE_DEV_TELEGRAM_ID=123456789 in .env.development
-- 2. Run: npx supabase db reset
-- 3. Start the app: pnpm dev
