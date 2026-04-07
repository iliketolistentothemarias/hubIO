-- Persist OAuth profile photo when a new auth user is created (Google: avatar_url / picture).
-- Run in Supabase SQL editor if your project already has handle_new_user().

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, karma, created_at, last_active_at, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    'volunteer',
    0,
    NOW(),
    NOW(),
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'avatar_url'), ''),
      NULLIF(trim(NEW.raw_user_meta_data->>'picture'), '')
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional one-time backfill for existing rows (uncomment and run once):
-- UPDATE public.users u
-- SET avatar = COALESCE(
--   NULLIF(trim(au.raw_user_meta_data->>'avatar_url'), ''),
--   NULLIF(trim(au.raw_user_meta_data->>'picture'), '')
-- )
-- FROM auth.users au
-- WHERE u.id = au.id
--   AND (u.avatar IS NULL OR trim(u.avatar) = '');
