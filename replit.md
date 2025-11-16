# Communify - Community Hub Platform

## Project Overview
Communify is a fully functional community engagement platform for South Fayette & Pittsburgh built with Next.js. The platform connects residents with local resources, events, and volunteer opportunities with a complete authentication system and admin moderation workflow.

## Recent Changes (November 16, 2025)

### Full Application Mode ✅ (Latest)
Transformed from UI showcase to fully functional application:
- ✅ Complete authentication system (signup, login, logout)
- ✅ Role-based access control (resident, admin, moderator)
- ✅ Resource submission workflow with admin approval
- ✅ Admin dashboard for managing pending submissions
- ✅ JWT-based authentication with httpOnly cookies
- ✅ PostgreSQL database with approval status tracking
- ✅ Secure password hashing with bcrypt
- ✅ Beautiful glass morphism UI maintained

### Latest Updates ✅
1. **Authentication Fixed**: Login and signup now properly use PostgreSQL instead of Replit Database key-value store
2. **App Renamed**: Changed from "Hubio" to "Communify" throughout the entire application
3. **JWT Security**: JWT_SECRET environment variable configured for secure token signing

### Vercel to Replit Migration Complete ✅
The project has been successfully migrated from Vercel to Replit with the following updates:

1. **PostgreSQL Database Migration**
   - Migrated from Supabase to Replit's built-in PostgreSQL database
   - Created database schema with 9 tables (users, resources, events, posts, etc.)
   - All migrations run successfully with proper foreign key constraints
   - Extension enabled: pgcrypto for UUID generation

2. **Server Configuration**
   - Next.js dev server configured for Replit (port 5000, host 0.0.0.0)
   - Deployment configured with autoscale for production
   - Workflow configured to run development server

3. **API Updates**
   - Updated authentication (signup/login) to use PostgreSQL
   - Updated posts API to use PostgreSQL with support for anonymous posts
   - Updated resources API to use PostgreSQL
   - Implemented JWT-based authentication

4. **Security Improvements**
   - Password hashing with bcryptjs
   - JWT token-based authentication with secure secret
   - Proper database connection pooling

## Environment Variables Required

### Critical (Configured ✅)
- `JWT_SECRET` - ✅ **SET** - Secure random string for JWT token signing

### Database (Already Configured ✅)
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Auto-configured by Replit

### Optional (For Full Functionality)
- `NEXT_PUBLIC_SUPABASE_URL` - For legacy Supabase features
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - For legacy Supabase features
- `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY` - For payment processing
- `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` - For PayPal payments
- `OPENAI_API_KEY` - For AI features
- `ANTHROPIC_API_KEY` - For AI features
- `GOOGLE_ANALYTICS_ID` - For analytics
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - For Google OAuth

## Database Schema

The database includes the following tables:
- **users** - User profiles and authentication (with role: resident, volunteer, organizer, admin, moderator)
- **resources** - Community resources with approval workflow (status: pending, approved, rejected, draft)
- **events** - Community events and gatherings
- **volunteer_opportunities** - Volunteer positions
- **posts** - Community board posts
- **post_comments** - Comments on posts
- **post_likes** - Post likes
- **fundraising_campaigns** - Fundraising campaigns
- **donations** - Donation records
- **event_registrations** - Event attendance
- **notifications** - User notifications
- **conversations** - Messaging conversations
- **messages** - Direct messages

### Resource Approval Fields
Resources table includes approval workflow fields:
- `status` - pending, approved, rejected, draft
- `submitted_by` - UUID reference to user who submitted
- `reviewed_by` - UUID reference to admin who reviewed
- `reviewed_at` - Timestamp of review
- `rejection_reason` - Optional reason for rejection

## Development

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5000` or your Replit URL.

## Database Management

Migrations are located in `lib/db/postgres-migrations/` and can be run with:

```bash
npx tsx lib/db/migrate.ts
```

To view database content or run SQL queries, use the Replit Database pane or the SQL execute tool.

## Architecture

- **Frontend**: Next.js 14 with React
- **Database**: PostgreSQL (Replit)
- **Authentication**: JWT-based with bcrypt password hashing
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Framer Motion

## Key Features

### Implemented ✅
- **User Authentication** - Secure signup/login with JWT tokens and bcrypt password hashing
- **Resource Submission** - Users can submit local resources for admin approval
- **Admin Dashboard** - Admins can review, approve, or reject pending resources
- **Role-Based Access** - Different permissions for residents, volunteers, organizers, admins, and moderators
- **Resource Directory** - Browse approved community resources

### Planned
- Event management and registration
- Volunteer opportunity listings
- Social feed and community posts
- Fundraising campaigns
- Real-time messaging

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Sign in and receive JWT token
- `POST /api/auth/logout` - Sign out and clear token
- `GET /api/auth/me` - Get current user profile

### Resources
- `POST /api/resources` - Submit a new resource (requires authentication)
- `POST /api/resources/submit` - Alternative submission endpoint

### Admin (requires admin/moderator role)
- `GET /api/admin/resources/pending` - Get all pending resources
- `PATCH /api/admin/resources/[id]/approve` - Approve a resource
- `PATCH /api/admin/resources/[id]/reject` - Reject a resource with reason

## Pages

- `/` - Home page
- `/login` - User login
- `/signup` - User registration
- `/directory` - Browse approved resources
- `/submit-resource` - Submit a new resource (requires auth)
- `/admin` - Admin dashboard for managing submissions (requires admin role)

## Testing Workflow

To test the complete workflow:
1. Sign up at `/signup` (creates resident account)
2. Log in at `/login`
3. Submit a resource at `/submit-resource`
4. Create an admin account (manually set role to 'admin' in database)
5. Log in as admin and visit `/admin`
6. Approve/reject pending resources
7. Verify approved resources appear in `/directory`

## Next Steps

1. ✅ ~~Implement authentication system~~ - DONE
2. ✅ ~~Implement resource approval workflow~~ - DONE
3. Connect directory page to show approved resources from database
4. Add event management features
5. Add volunteer opportunity features
6. Deploy to production when ready

## Support

For issues or questions, refer to the documentation in:
- `ARCHITECTURE.md` - System architecture
- `FEATURES.md` - Feature documentation
- `DEPLOYMENT.md` - Deployment guide
