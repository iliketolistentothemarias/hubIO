# Admin Setup Guide

This guide explains how to set up admin access for your HubIO application.

## Making a User an Admin

### Option 1: Using the API Endpoint (Recommended)

You can make a user an admin by calling the API endpoint:

```bash
curl -X POST http://localhost:3000/api/admin/make-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "ameyaparnerkar@gmail.com"}'
```

### Option 2: Using the Script

Run the script directly:

```bash
npx tsx scripts/make-admin.ts ameyaparnerkar@gmail.com
```

### Option 3: Direct Database Update

If you have direct database access, you can update the user's role:

```sql
UPDATE users SET role = 'admin' WHERE email = 'ameyaparnerkar@gmail.com';
```

## Setting Up the Notifications Table

Run the migration to create the notifications table:

```sql
-- Run the SQL in lib/db/migrations/create_notifications_table.sql
```

Or if using Supabase, you can run it in the SQL Editor.

## Admin Features

Once you're an admin, you can:

1. **Access Admin Panel**: Navigate to `/admin` or `/admin/dashboard`
2. **Review Pending Resources**: View and approve/deny resource submissions
3. **Manage Admins**: Add or remove admin privileges from users
4. **Manage Resources**: Edit, delete, and manage all resources
5. **View System Stats**: See platform statistics and metrics

## Admin Panel Tabs

- **Pending Resources**: Review and approve/deny submitted resources
- **Campaigns**: Manage fundraising campaigns
- **Resources**: Manage all approved resources
- **Events**: Manage community events
- **Volunteers**: Manage volunteer opportunities
- **Admin Management**: Add/remove admin privileges

## Notification System

The notification system automatically sends notifications when:
- A resource is approved
- A resource is denied

Users can view notifications by clicking the bell icon in the navigation (when implemented).

## Security Notes

- Admin routes are protected and only accessible to users with `role = 'admin'`
- The admin panel checks authentication on every page load
- Non-admin users are automatically redirected to the login page
- Admin operations use the Supabase service role key to bypass RLS

