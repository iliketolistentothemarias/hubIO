# Database Setup Instructions

## Quick Fix for "Could not find the table 'public.users'" Error

If you're seeing the error: **"Could not find the table 'public.users' in the schema cache"**, you need to create the users table in your Supabase database.

### Steps to Fix:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration Script**
   - Copy the entire contents of `lib/db/migrations/create_users_table.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify the Table was Created**
   - Go to "Table Editor" in the left sidebar
   - You should see a `users` table listed

### Alternative: Run All Migrations

If you want to set up all tables at once, run these migration files in order:

1. `lib/db/migrations/create_users_table.sql`
2. `lib/db/migrations/create_resources_table.sql`
3. `lib/db/migrations/create_notifications_table.sql`

### What the Migration Does:

- Creates the `users` table with all required fields
- Sets up indexes for better performance
- Enables Row Level Security (RLS)
- Creates security policies
- Sets up triggers to automatically create user profiles on signup
- Sets up triggers to update `last_active_at` automatically

### After Running the Migration:

1. The error should be resolved
2. New user signups will automatically create profiles
3. Existing auth users can sign in (profiles will be created on first login)

### Troubleshooting:

- **Still seeing errors?** Make sure you're running the SQL in the correct Supabase project
- **Permission errors?** Make sure you're logged in as the project owner
- **Table already exists?** The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times

