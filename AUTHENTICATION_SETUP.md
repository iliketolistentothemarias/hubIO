# Authentication Setup Guide

## Overview

This project now has a fully functional signup and login system that integrates with Supabase Auth and stores user data in the Supabase database.

## What Was Created

### 1. API Routes (`app/api/auth/`)
- **`/api/auth/signup`** - Handles user registration
- **`/api/auth/login`** - Handles user authentication
- **`/api/auth/logout`** - Handles user logout
- **`/api/auth/session`** - Gets current user session

### 2. Pages
- **`/app/signup/page.tsx`** - Sign up page with form validation
- **`/app/login/page.tsx`** - Updated login page to use Supabase authentication

### 3. Updated Services
- **`lib/auth/index.ts`** - Updated to integrate with Supabase Auth
- **`lib/supabase/client.ts`** - Updated to use environment variables
- **`lib/supabase/server.ts`** - New server-side Supabase client helper

### 4. Database Setup
- **`lib/db/migrations/create_users_table.sql`** - SQL migration to create users table
- **`lib/db/README.md`** - Database setup instructions

## Features

### Sign Up
- Email and password validation
- Password confirmation
- Automatic user profile creation in database
- Session management
- Error handling

### Login
- Email/password authentication
- OAuth support (Google)
- Session management
- Error handling

### Database Storage
- User profiles stored in Supabase `users` table
- Automatic profile creation on signup
- Last active timestamp updates
- Row Level Security (RLS) enabled

## Setup Instructions

### 1. Database Setup

Run the SQL migration to create the users table:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `lib/db/migrations/create_users_table.sql`
4. Run the SQL script

This will:
- Create the `users` table
- Set up indexes
- Enable Row Level Security
- Create security policies
- Set up automatic triggers

### 2. Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional, for admin operations)
```

### 3. Test the Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/signup` to create a new account
3. Navigate to `/login` to sign in
4. After successful login/signup, you'll be redirected to `/dashboard`

## User Data Stored

The following user data is stored in the database:

- **id** - UUID (matches Supabase Auth user ID)
- **email** - User's email address (unique)
- **name** - User's full name
- **role** - User role (resident, volunteer, organizer, admin, moderator)
- **avatar** - Optional profile picture URL
- **karma** - User's karma points (default: 0)
- **created_at** - Account creation timestamp
- **last_active_at** - Last activity timestamp (auto-updated)

## Security Features

- **Password Validation** - Minimum 6 characters
- **Email Validation** - Proper email format checking
- **Row Level Security** - Database-level access control
- **Session Management** - Secure session handling via Supabase
- **Error Handling** - Comprehensive error messages

## API Usage

### Sign Up
```typescript
POST /api/auth/signup
Body: {
  email: string,
  password: string,
  name: string
}
```

### Login
```typescript
POST /api/auth/login
Body: {
  email: string,
  password: string
}
```

### Logout
```typescript
POST /api/auth/logout
```

### Get Session
```typescript
GET /api/auth/session
```

## Google OAuth Setup

To enable Google OAuth login:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)
5. Add redirect URL: `https://yourdomain.com/auth/callback` (or `http://localhost:3000/auth/callback` for development)
6. In Google Cloud Console, add the redirect URI: `https://your-project.supabase.co/auth/v1/callback`

## Next Steps

1. Set up Google OAuth in Supabase dashboard (see above)
2. Customize user roles and permissions
3. Add email verification (optional)
4. Add password reset functionality
5. Add profile editing features

## Troubleshooting

### "Failed to create user profile"
- Make sure the users table exists in your database
- Check that RLS policies are set up correctly
- Verify your Supabase credentials in `.env.local`

### "Invalid email or password"
- Check that the user exists in Supabase Auth
- Verify the password is correct
- Check Supabase Auth logs for more details

### OAuth not working
- Make sure OAuth providers are configured in Supabase dashboard
- Check redirect URLs are set correctly
- Verify OAuth credentials are correct

## Notes

- The authentication system uses Supabase Auth for secure password hashing and session management
- User profiles are automatically created when users sign up (via trigger or API)
- The `last_active_at` field is automatically updated on user activity
- All authentication is handled server-side for security

