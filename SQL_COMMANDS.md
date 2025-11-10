# SQL Commands for HubIO Setup

Run these commands in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

## 1. Create Users Table (Run this first!)

```sql
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'volunteer', 'organizer', 'admin', 'moderator')),
  avatar TEXT,
  karma INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_karma ON public.users(karma DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

-- Create policies for RLS
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- All authenticated users can view other users (for community features)
CREATE POLICY "Authenticated users can view all profiles"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admins can insert any user
CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, karma, created_at, last_active_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'resident',
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create a function to update last_active_at
CREATE OR REPLACE FUNCTION public.update_last_active_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_active_at on user updates
DROP TRIGGER IF EXISTS update_users_last_active ON public.users;
CREATE TRIGGER update_users_last_active
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_active_at();
```

## 2. Make a User Admin

Replace `'your-email@example.com'` with your actual email:

```sql
-- Make a user admin by email
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## 3. Check if User Exists

```sql
-- Check if your user exists in the users table
SELECT id, email, name, role, created_at 
FROM public.users 
WHERE email = 'your-email@example.com';
```

## 4. Create User Profile Manually (if signup didn't create it)

Replace the values with your actual user info:

```sql
-- First, get your auth user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then insert into users table (use the ID from above)
INSERT INTO public.users (id, email, name, role, karma, created_at, last_active_at)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',  -- Replace with actual UUID from auth.users
  'your-email@example.com',
  'Your Name',
  'admin',  -- or 'resident' if you want to make admin later
  0,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role;
```

## 5. List All Users

```sql
-- See all users and their roles
SELECT id, email, name, role, created_at 
FROM public.users 
ORDER BY created_at DESC;
```

## 6. Fix Missing User Profiles (for existing auth users)

```sql
-- Create profiles for all auth users that don't have profiles yet
INSERT INTO public.users (id, email, name, role, karma, created_at, last_active_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  'resident' as role,
  0 as karma,
  au.created_at,
  NOW() as last_active_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

## 7. Grant Admin Access to Service Role (for API operations)

```sql
-- Allow service role to bypass RLS (needed for admin operations)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (this is safe, service role is server-side only)
CREATE POLICY IF NOT EXISTS "Service role can do everything"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## Troubleshooting

### If you get "relation does not exist" error:
Run the CREATE TABLE command from step 1.

### If you get "permission denied" error:
Make sure you're running as the project owner in Supabase, or use the service role key.

### If user profile doesn't exist after signup:
Run command #6 to create profiles for existing auth users.

### If you can't update user role:
Make sure RLS policies are set up correctly (step 1), or temporarily disable RLS:
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- Do your updates
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

