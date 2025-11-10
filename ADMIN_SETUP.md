# Admin Panel Setup Guide

## Quick Start

### 1. Run SQL Setup

Run the complete setup script in Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of COMPLETE_SETUP.sql
-- Or run each migration file individually:
-- 1. lib/db/migrations/create_users_table.sql
-- 2. lib/db/migrations/create_events_table.sql
-- 3. lib/db/migrations/create_volunteer_opportunities_table.sql
-- 4. lib/db/migrations/create_fundraising_campaigns_table.sql
-- 5. lib/db/migrations/seed_data.sql (adds mock data)
```

### 2. Make Yourself Admin

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 3. Start the App

```bash
cd hubIO
npm run dev
```

### 4. Login and Access Admin Panel

1. Go to `http://localhost:3001/login`
2. Login with your credentials
3. Navigate to `http://localhost:3001/admin`
4. You should see the admin dashboard

## Admin Panel Features

### ✅ Working Features

1. **Pending Resources Tab**
   - View all pending resource submissions
   - Approve resources (makes them verified and visible)
   - Deny resources (deletes them with optional reason)

2. **Campaigns Tab**
   - View all fundraising campaigns
   - Edit campaign details
   - Delete campaigns

3. **Resources Tab**
   - View all verified resources
   - Edit resource details
   - Delete resources

4. **Events Tab**
   - View all events
   - Delete events

5. **Volunteers Tab**
   - View all volunteer opportunities
   - Delete volunteer opportunities

6. **Admin Management Tab**
   - View all users
   - Make users admin
   - Remove admin status from users
   - Update user roles (resident, volunteer, organizer, admin, moderator)

## API Endpoints

### Admin Endpoints

- `GET /api/admin/pending-resources` - Get pending resources (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Update user role (admin only)
- `GET /api/admin/events` - Get all events (admin only)
- `DELETE /api/admin/events?id={id}` - Delete event (admin only)
- `GET /api/admin/campaigns` - Get all campaigns (admin only)
- `DELETE /api/admin/campaigns?id={id}` - Delete campaign (admin only)
- `GET /api/admin/volunteers` - Get all volunteer opportunities (admin only)
- `DELETE /api/admin/volunteers?id={id}` - Delete volunteer opportunity (admin only)
- `POST /api/admin/resources/{id}/approve` - Approve resource (admin only)
- `POST /api/admin/resources/{id}/deny` - Deny resource (admin only)

### Resource Endpoints

- `PUT /api/resources/{id}` - Update resource (owner or admin)
- `DELETE /api/resources/{id}` - Delete resource (admin only)

### Campaign Endpoints

- `PATCH /api/campaigns/{id}` - Update campaign (owner or admin)
- `DELETE /api/campaigns/{id}` - Delete campaign (admin only)

## Mock Data

The seed data includes:

- **5 Volunteer Opportunities**: Food Bank, Tutoring, Park Cleanup, Senior Companion, Animal Shelter
- **5 Events**: Health Fair, Job Fair, Garden Workshop, Youth Sports Day, Financial Literacy Workshop
- **5 Fundraising Campaigns**: School Supplies, Housing Assistance, Food Bank Expansion, Youth Scholarships, Emergency Relief

All data is located in Pittsburgh, PA and has realistic details.

## Troubleshooting

### Admin Panel Not Loading

1. Check if you're logged in
2. Verify your user role is 'admin' in the database
3. Check browser console for errors
4. Verify API endpoints are returning data

### API Errors

1. Check if tables exist in Supabase
2. Verify RLS policies are set up correctly
3. Check if user is authenticated
4. Verify user has admin role

### Buttons Not Working

1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check network tab for failed requests
4. Verify authentication is working

## Environment Variables

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional, but recommended for admin operations)
```

## Notes

- Admin client (service role) is optional but recommended for admin operations
- If service role key is not set, the app will use regular client with RLS policies
- All admin endpoints check authentication and admin role
- Error handling is in place for missing tables or failed operations
