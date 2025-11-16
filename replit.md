# Communify - Community Hub Platform (UI Showcase)

## Project Overview
Communify is a beautifully designed community engagement platform UI built with Next.js. This is a **static UI showcase** with no backend functionality - perfect for demonstrations, portfolios, and design presentations.

## Recent Changes (November 16, 2025)

### UI-Only Mode ✅ (Latest)
Transformed into a pure UI showcase:
- ❌ Removed all authentication (Sign In/Sign Up)
- ❌ Removed ProfileMenu and Messaging components
- ❌ Removed all backend API calls
- ✅ Static dashboard with sample data
- ✅ Fixed Service Worker errors
- ✅ Improved dark mode colors with brand palette
- ✅ Enhanced centering and layout alignment
- ✅ Beautiful glass morphism effects throughout

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
- **users** - User profiles and authentication
- **resources** - Community resources (organizations, services)
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

- User authentication (signup/login)
- Community resource directory
- Event management and registration
- Volunteer opportunity listings
- Social feed and community posts
- Fundraising campaigns
- Real-time messaging
- Admin moderation tools

## Testing

Authentication has been tested and verified:
- ✅ User signup with PostgreSQL
- ✅ User login with JWT token generation
- ✅ Password hashing and verification
- ✅ Secure token signing with JWT_SECRET

## Next Steps

1. ✅ ~~Set `JWT_SECRET` environment variable~~ - DONE
2. Test core functionality (signup, login, posts, resources)
3. Add payment provider keys if using payment features
4. Configure optional integrations as needed
5. Deploy to production when ready

## Support

For issues or questions, refer to the documentation in:
- `ARCHITECTURE.md` - System architecture
- `FEATURES.md` - Feature documentation
- `DEPLOYMENT.md` - Deployment guide
