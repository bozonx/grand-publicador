-- Create test user (auth.users is managed by Supabase Auth, so we insert into public.users via trigger or manually if needed for tests)
-- Note: In local development, we can insert into auth.users directly for seeding, but it's tricky with password hashing.
-- Better approach: Create a user via Supabase API or just seed public tables assuming user exists.

-- For now, let's just seed some public data assuming a user with ID '00000000-0000-0000-0000-000000000000' exists (we can create it via SQL for testing)

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES 
('00000000-0000-0000-0000-000000000000', 'test@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test User"}')
ON CONFLICT (id) DO NOTHING;

-- The trigger 'on_auth_user_created' should handle creation in public.users, 
-- but since we might be inserting into auth.users directly in seed, let's ensure public.users has the record if trigger didn't fire (triggers usually fire on INSERT).

-- Create a Blog
INSERT INTO public.blogs (id, name, slug, description, owner_id)
VALUES 
('11111111-1111-1111-1111-111111111111', 'My Tech Blog', 'tech-blog', 'A blog about technology and coding', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Add Member
INSERT INTO public.blog_members (blog_id, user_id, role)
VALUES 
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'owner')
ON CONFLICT (blog_id, user_id) DO NOTHING;

-- Create a Channel
INSERT INTO public.channels (id, blog_id, platform, name, identifier)
VALUES 
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'telegram', 'Tech News Channel', '@tech_news_test')
ON CONFLICT (id) DO NOTHING;

-- Create a Post
INSERT INTO public.posts (id, blog_id, author_id, title, content, status)
VALUES 
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Hello World', '<p>Welcome to my first post!</p>', 'draft')
ON CONFLICT (id) DO NOTHING;
