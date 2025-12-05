-- Add telegram_id and is_admin columns to users table
ALTER TABLE public.users 
ADD COLUMN telegram_id BIGINT UNIQUE,
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Create index for telegram_id lookups
CREATE INDEX idx_users_telegram_id ON public.users(telegram_id);

-- Update RLS policy to allow viewing users by telegram_id
CREATE POLICY "Users can view other users by telegram_id" 
    ON public.users FOR SELECT 
    USING (true);

-- Allow admins to update any user
CREATE POLICY "Admins can update any user" 
    ON public.users FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Function to find or create user by telegram_id
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

    -- Try to find existing user
    SELECT * INTO v_user FROM public.users WHERE telegram_id = p_telegram_id;
    
    IF v_user.id IS NOT NULL THEN
        -- Update user info if changed
        UPDATE public.users 
        SET 
            full_name = COALESCE(v_full_name, full_name),
            updated_at = NOW()
        WHERE telegram_id = p_telegram_id
        RETURNING * INTO v_user;
        
        RETURN v_user;
    END IF;
    
    -- Create new user (will be linked to auth.users later or work standalone)
    INSERT INTO public.users (id, email, telegram_id, full_name, created_at, updated_at)
    VALUES (
        uuid_generate_v4(),
        COALESCE(p_username, 'tg_' || p_telegram_id::TEXT) || '@telegram.local',
        p_telegram_id,
        v_full_name,
        NOW(),
        NOW()
    )
    RETURNING * INTO v_user;
    
    RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.find_or_create_telegram_user TO anon, authenticated;
