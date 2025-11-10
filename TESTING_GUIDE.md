# Testing Guide for HubIO Authentication and Admin Features

## Prerequisites

1. **Supabase Database Setup**
   - Run the migration script: `lib/db/migrations/create_users_table.sql` in Supabase SQL Editor
   - Ensure the `users` table exists with proper RLS policies

2. **Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)

## Testing Authentication

### 1. Test Signup

**Endpoint:** `POST /api/auth/signup`

**Request:**
```json
{
  "email": "test@example.com",
  "password": "test123456",
  "name": "Test User"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User",
      "role": "resident"
    },
    "session": { ... }
  },
  "message": "Account created successfully"
}
```

**Test in Browser:**
1. Navigate to `/signup`
2. Fill in the form
3. Submit
4. Should redirect to dashboard or login page

### 2. Test Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "test@example.com",
  "password": "test123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User",
      "role": "resident"
    },
    "session": { ... }
  }
}
```

**Test in Browser:**
1. Navigate to `/login`
2. Enter credentials
3. Submit
4. Should redirect to dashboard

### 3. Test Session

**Endpoint:** `GET /api/auth/session`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { ... }
  }
}
```

**Test in Browser:**
- Should automatically check session on page load
- If logged in, should show user info
- If not logged in, should redirect to login

### 4. Test Logout

**Endpoint:** `POST /api/auth/logout`

**Expected Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Test in Browser:**
1. Click logout button
2. Should clear session
3. Should redirect to home or login page

## Testing Admin Features

### 1. Create Admin User

**Option A: Using API (requires service role key)**
```bash
curl -X POST http://localhost:3001/api/admin/make-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```

**Option B: Direct Database Update**
1. Go to Supabase Dashboard → Table Editor → `users`
2. Find your user
3. Update `role` field to `admin`

**Option C: Using SQL**
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 2. Test Admin Dashboard Access

**Test in Browser:**
1. Login as admin user
2. Navigate to `/admin` or `/admin/dashboard`
3. Should see admin dashboard with tabs:
   - Pending Resources
   - Resources
   - Campaigns
   - Events
   - Volunteers
   - Admin Management

### 3. Test User Management

**Get All Users**
- **Endpoint:** `GET /api/admin/users`
- **Requires:** Admin authentication
- **Expected:** List of all users with their roles

**Update User Role**
- **Endpoint:** `POST /api/admin/users`
- **Request:**
  ```json
  {
    "userId": "user-id-here",
    "role": "admin"  // or "resident", "volunteer", "organizer", "moderator"
  }
  ```
- **Requires:** Admin authentication
- **Expected:** Updated user object

**Test in Browser:**
1. Go to `/admin` → "Admin Management" tab
2. See list of all users
3. Click "Make Admin" or "Remove Admin" buttons
4. Should update role and refresh list

### 4. Test Resource Management

**Approve Resource**
- **Endpoint:** `POST /api/admin/resources/[id]/approve`
- **Requires:** Admin authentication

**Deny Resource**
- **Endpoint:** `POST /api/admin/resources/[id]/deny`
- **Request:**
  ```json
  {
    "reason": "Reason for denial"
  }
  ```
- **Requires:** Admin authentication

**Test in Browser:**
1. Go to `/admin` → "Pending Resources" tab
2. See pending resources
3. Click "Approve" or "Deny" buttons
4. Should update resource status

## Common Issues and Solutions

### Issue: "Could not find the table 'public.users'"
**Solution:** Run the migration script in Supabase SQL Editor

### Issue: "Admin access required"
**Solution:** Make sure your user has `role = 'admin'` in the users table

### Issue: "Authentication required"
**Solution:** Make sure you're logged in and session is valid

### Issue: "Admin client not configured"
**Solution:** Set `SUPABASE_SERVICE_ROLE_KEY` environment variable

### Issue: Users not loading in admin page
**Solution:** 
1. Check browser console for errors
2. Verify `/api/admin/users` endpoint works
3. Check that user is authenticated and is admin
4. Verify RLS policies allow admin to read users

## Manual Testing Checklist

- [ ] Sign up new user
- [ ] Login with credentials
- [ ] Check session persists on page refresh
- [ ] Logout works
- [ ] Create admin user (via database or API)
- [ ] Login as admin
- [ ] Access admin dashboard
- [ ] View all users in admin panel
- [ ] Update user role (make admin / remove admin)
- [ ] Approve pending resource
- [ ] Deny pending resource
- [ ] Verify non-admin users cannot access admin routes

## API Testing with curl

```bash
# Signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}' \
  -c cookies.txt

# Get session (with cookies)
curl -X GET http://localhost:3001/api/auth/session \
  -b cookies.txt

# Get users (admin only, with cookies from admin login)
curl -X GET http://localhost:3001/api/admin/users \
  -b cookies.txt

# Update user role (admin only)
curl -X POST http://localhost:3001/api/admin/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"userId":"user-id","role":"admin"}'
```

## Notes

- All admin endpoints require authentication and admin role
- Session is managed via cookies (Supabase handles this automatically)
- RLS policies ensure users can only access their own data
- Admin client (service role) bypasses RLS for admin operations
- User roles: `resident`, `volunteer`, `organizer`, `admin`, `moderator`

