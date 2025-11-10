# Database Setup Guide

## Users Table Setup

To set up the users table in your Supabase database, run the SQL migration file:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `lib/db/migrations/create_users_table.sql`
4. Run the SQL script

This will:
- Create the `users` table with all required fields
- Set up indexes for better performance
- Enable Row Level Security (RLS)
- Create policies for secure data access
- Set up triggers to automatically create user profiles when users sign up
- Set up triggers to update `last_active_at` automatically

## Table Schema

The `users` table has the following structure:

```sql
- id: UUID (primary key, references auth.users)
- email: TEXT (unique, not null)
- name: TEXT (not null)
- role: TEXT (default: 'resident', must be one of: resident, volunteer, organizer, admin, moderator)
- avatar: TEXT (optional)
- karma: INTEGER (default: 0)
- created_at: TIMESTAMPTZ (auto-generated)
- last_active_at: TIMESTAMPTZ (auto-updated)
```

## Security

- Row Level Security (RLS) is enabled
- Users can only view and update their own profiles
- All authenticated users can view other users (for community features)
- Only admins can insert new users directly (usually done via triggers)

## Automatic Profile Creation

When a user signs up via Supabase Auth, a trigger automatically creates their profile in the `users` table. This ensures that every authenticated user has a corresponding profile.

## Manual Setup (Alternative)

If you prefer to set up the table manually:

1. Create the table with the schema above
2. Set up the indexes
3. Enable RLS
4. Create the policies
5. Set up the triggers

See `lib/db/migrations/create_users_table.sql` for the complete SQL script.

