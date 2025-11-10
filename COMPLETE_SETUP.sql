-- ============================================================================
-- COMPLETE SETUP SCRIPT FOR HUBIO
-- ============================================================================
-- Run this entire script in Supabase SQL Editor to set up everything
-- Make sure to run it in order (don't skip steps)
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE USERS TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_karma ON public.users(karma DESC);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view all profiles"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_last_active_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_last_active ON public.users;
CREATE TRIGGER update_users_last_active
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_active_at();

-- ============================================================================
-- STEP 2: CREATE EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location JSONB,
  organizer TEXT NOT NULL,
  organizer_id TEXT NOT NULL,
  capacity INTEGER,
  registered INTEGER NOT NULL DEFAULT 0,
  rsvp_required BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE OR REPLACE FUNCTION public.update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_events_updated_at();

-- ============================================================================
-- STEP 3: CREATE VOLUNTEER OPPORTUNITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.volunteer_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organization TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  category TEXT NOT NULL,
  location JSONB,
  skills_required TEXT[] DEFAULT '{}',
  time_commitment TEXT,
  age_requirement TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_category ON public.volunteer_opportunities(category);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_status ON public.volunteer_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_organization ON public.volunteer_opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_created_at ON public.volunteer_opportunities(created_at DESC);

ALTER TABLE public.volunteer_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view volunteer opportunities"
  ON public.volunteer_opportunities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert volunteer opportunities"
  ON public.volunteer_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own volunteer opportunities"
  ON public.volunteer_opportunities FOR UPDATE
  TO authenticated
  USING (organization_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete volunteer opportunities"
  ON public.volunteer_opportunities FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE OR REPLACE FUNCTION public.update_volunteer_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_volunteer_opportunities_updated_at ON public.volunteer_opportunities;
CREATE TRIGGER update_volunteer_opportunities_updated_at
  BEFORE UPDATE ON public.volunteer_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_volunteer_opportunities_updated_at();

-- ============================================================================
-- STEP 4: CREATE FUNDRAISING CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fundraising_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  goal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  raised DECIMAL(10, 2) NOT NULL DEFAULT 0,
  donors INTEGER NOT NULL DEFAULT 0,
  organizer TEXT,
  organizer_id TEXT,
  location JSONB,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_category ON public.fundraising_campaigns(category);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_status ON public.fundraising_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_organizer ON public.fundraising_campaigns(organizer_id);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_created_at ON public.fundraising_campaigns(created_at DESC);

ALTER TABLE public.fundraising_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fundraising campaigns"
  ON public.fundraising_campaigns FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert fundraising campaigns"
  ON public.fundraising_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own fundraising campaigns"
  ON public.fundraising_campaigns FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete fundraising campaigns"
  ON public.fundraising_campaigns FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE OR REPLACE FUNCTION public.update_fundraising_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fundraising_campaigns_updated_at ON public.fundraising_campaigns;
CREATE TRIGGER update_fundraising_campaigns_updated_at
  BEFORE UPDATE ON public.fundraising_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fundraising_campaigns_updated_at();

-- ============================================================================
-- STEP 5: SEED DATA (Mock Data)
-- ============================================================================

-- Insert sample volunteer opportunities
INSERT INTO public.volunteer_opportunities (title, description, organization, organization_id, category, location, skills_required, time_commitment, status) VALUES
('Food Bank Volunteer', 'Help sort and distribute food to families in need', 'Community Food Bank', '00000000-0000-0000-0000-000000000000', 'Community Service', '{"lat": 40.4406, "lng": -79.9961, "address": "123 Main St", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', ARRAY['Organization', 'Communication'], '4 hours per week', 'active'),
('Tutoring Program', 'Tutor students in math and reading', 'Education Foundation', '00000000-0000-0000-0000-000000000000', 'Education', '{"lat": 40.4406, "lng": -79.9961, "address": "456 School Ave", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', ARRAY['Teaching', 'Patience'], '2 hours per week', 'active'),
('Park Cleanup', 'Help clean and maintain local parks', 'Parks Department', '00000000-0000-0000-0000-000000000000', 'Environmental', '{"lat": 40.4406, "lng": -79.9961, "address": "789 Park Rd", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', ARRAY['Physical fitness'], '3 hours per month', 'active'),
('Senior Companion', 'Visit and assist elderly residents', 'Senior Services', '00000000-0000-0000-0000-000000000000', 'Community Service', '{"lat": 40.4406, "lng": -79.9961, "address": "321 Elder St", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', ARRAY['Compassion', 'Communication'], '2 hours per week', 'active'),
('Animal Shelter Helper', 'Care for animals at local shelter', 'Animal Rescue', '00000000-0000-0000-0000-000000000000', 'Animal Care', '{"lat": 40.4406, "lng": -79.9961, "address": "654 Pet Ave", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', ARRAY['Animal care'], '4 hours per week', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample events
INSERT INTO public.events (name, description, category, date, time, location, organizer, organizer_id, capacity, registered, rsvp_required, tags, status) VALUES
('Community Health Fair', 'Free health screenings and wellness resources', 'Health', CURRENT_DATE + INTERVAL '7 days', '10:00 AM', '{"lat": 40.4406, "lng": -79.9961, "address": "100 Health Way", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', 'Community Health Center', '00000000-0000-0000-0000-000000000000', 200, 45, true, ARRAY['health', 'wellness', 'free'], 'upcoming'),
('Job Fair 2024', 'Connect with local employers and find job opportunities', 'Employment', CURRENT_DATE + INTERVAL '14 days', '9:00 AM', '{"lat": 40.4406, "lng": -79.9961, "address": "200 Career Blvd", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', 'Employment Services', '00000000-0000-0000-0000-000000000000', 500, 120, false, ARRAY['jobs', 'employment', 'career'], 'upcoming'),
('Community Garden Workshop', 'Learn about urban gardening and sustainability', 'Education', CURRENT_DATE + INTERVAL '10 days', '2:00 PM', '{"lat": 40.4406, "lng": -79.9961, "address": "300 Garden St", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', 'Green Thumb Org', '00000000-0000-0000-0000-000000000000', 50, 25, true, ARRAY['gardening', 'sustainability', 'education'], 'upcoming'),
('Youth Sports Day', 'Free sports activities for kids ages 5-15', 'Recreation', CURRENT_DATE + INTERVAL '5 days', '11:00 AM', '{"lat": 40.4406, "lng": -79.9961, "address": "400 Sports Park", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', 'Youth Sports League', '00000000-0000-0000-0000-000000000000', 100, 60, false, ARRAY['sports', 'youth', 'free'], 'upcoming'),
('Financial Literacy Workshop', 'Learn about budgeting, saving, and credit', 'Education', CURRENT_DATE + INTERVAL '12 days', '6:00 PM', '{"lat": 40.4406, "lng": -79.9961, "address": "500 Finance Ave", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', 'Financial Services', '00000000-0000-0000-0000-000000000000', 75, 30, true, ARRAY['finance', 'education', 'workshop'], 'upcoming')
ON CONFLICT DO NOTHING;

-- Insert sample fundraising campaigns
INSERT INTO public.fundraising_campaigns (title, description, category, goal, raised, donors, organizer, organizer_id, location, deadline, status, tags) VALUES
('School Supplies Drive', 'Help provide school supplies for students in need', 'Education', 5000.00, 3250.00, 45, 'Education Foundation', '00000000-0000-0000-0000-000000000000', '{"lat": 40.4406, "lng": -79.9961, "address": "600 School Dr", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', CURRENT_DATE + INTERVAL '30 days', 'active', ARRAY['education', 'school', 'donations']),
('Housing Assistance Fund', 'Support families facing housing insecurity', 'Housing', 10000.00, 6750.00, 78, 'Housing Services', '00000000-0000-0000-0000-000000000000', '{"lat": 40.4406, "lng": -79.9961, "address": "700 Home St", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', CURRENT_DATE + INTERVAL '60 days', 'active', ARRAY['housing', 'assistance', 'community']),
('Food Bank Expansion', 'Help expand our food bank to serve more families', 'Community Service', 15000.00, 11200.00, 120, 'Community Food Bank', '00000000-0000-0000-0000-000000000000', '{"lat": 40.4406, "lng": -79.9961, "address": "800 Food Way", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', CURRENT_DATE + INTERVAL '45 days', 'active', ARRAY['food', 'community', 'expansion']),
('Youth Program Scholarship', 'Provide scholarships for youth programs', 'Youth', 8000.00, 4800.00, 55, 'Youth Services', '00000000-0000-0000-0000-000000000000', '{"lat": 40.4406, "lng": -79.9961, "address": "900 Youth Ave", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', CURRENT_DATE + INTERVAL '40 days', 'active', ARRAY['youth', 'scholarship', 'programs']),
('Emergency Relief Fund', 'Support families in crisis situations', 'Emergency', 20000.00, 15800.00, 200, 'Emergency Services', '00000000-0000-0000-0000-000000000000', '{"lat": 40.4406, "lng": -79.9961, "address": "1000 Emergency Rd", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', CURRENT_DATE + INTERVAL '90 days', 'active', ARRAY['emergency', 'relief', 'crisis'])
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 6: MAKE YOURSELF ADMIN (Replace email)
-- ============================================================================

-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- ============================================================================
-- DONE! Your database is now set up with all tables and sample data.
-- ============================================================================

