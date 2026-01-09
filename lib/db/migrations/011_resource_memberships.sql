-- Resource Ownership & Signup System
-- Enables resource owners/managers, volunteer signups, and moderator visibility

-- =====================================================================
-- Helper Functions
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_resource_manager(resource_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.resource_members
    WHERE resource_id = resource_uuid
      AND user_id = auth.uid()
      AND invitation_status = 'accepted'
      AND role IN ('owner', 'manager', 'moderator')
  );
$$;

-- =====================================================================
-- Resource Members (owners/managers/moderators)
-- =====================================================================

CREATE TABLE IF NOT EXISTS resource_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'moderator', 'viewer')),
  invitation_status TEXT NOT NULL DEFAULT 'accepted' CHECK (invitation_status IN ('pending', 'accepted', 'declined', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_members_resource ON resource_members(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_members_user ON resource_members(user_id);

ALTER TABLE resource_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view roster"
  ON resource_members FOR SELECT
  USING (
    is_resource_manager(resource_id)
    OR user_id = auth.uid()
    OR is_platform_admin()
  );

CREATE POLICY "Managers can invite members"
  ON resource_members FOR INSERT
  WITH CHECK (is_resource_manager(resource_id) OR is_platform_admin());

CREATE POLICY "Managers can update roster"
  ON resource_members FOR UPDATE
  USING (is_resource_manager(resource_id) OR is_platform_admin());

CREATE POLICY "Managers can remove members"
  ON resource_members FOR DELETE
  USING (is_resource_manager(resource_id) OR is_platform_admin());

-- Automatically add submitter as owner when resource is created
CREATE OR REPLACE FUNCTION public.add_resource_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.submitted_by IS NOT NULL THEN
    INSERT INTO resource_members (resource_id, user_id, role, invitation_status)
    VALUES (NEW.id, NEW.submitted_by, 'owner', 'accepted')
    ON CONFLICT (resource_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS add_resource_owner_member ON resources;
CREATE TRIGGER add_resource_owner_member
  AFTER INSERT ON resources
  FOR EACH ROW
  EXECUTE FUNCTION public.add_resource_owner_member();

-- Backfill existing resources
INSERT INTO resource_members (resource_id, user_id, role, invitation_status)
SELECT id, submitted_by, 'owner', 'accepted'
FROM resources
WHERE submitted_by IS NOT NULL
ON CONFLICT (resource_id, user_id) DO NOTHING;

-- =====================================================================
-- Resource Signups (volunteer RSVPs)
-- =====================================================================

CREATE TABLE IF NOT EXISTS resource_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'waitlist', 'cancelled', 'rejected')),
  message TEXT,
  slots INTEGER NOT NULL DEFAULT 1 CHECK (slots > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_signups_resource ON resource_signups(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_signups_user ON resource_signups(user_id);

ALTER TABLE resource_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Volunteers can view their signups"
  ON resource_signups FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_resource_manager(resource_id)
    OR is_platform_admin()
  );

CREATE POLICY "Volunteers can sign up"
  ON resource_signups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Volunteers or managers can update signups"
  ON resource_signups FOR UPDATE
  USING (
    user_id = auth.uid()
    OR is_resource_manager(resource_id)
    OR is_platform_admin()
  )
  WITH CHECK (
    user_id = auth.uid()
    OR is_resource_manager(resource_id)
    OR is_platform_admin()
  );

CREATE POLICY "Managers can remove signups"
  ON resource_signups FOR DELETE
  USING (
    user_id = auth.uid()
    OR is_resource_manager(resource_id)
    OR is_platform_admin()
  );

CREATE OR REPLACE FUNCTION public.update_resource_signup_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_resource_signup_timestamp ON resource_signups;
CREATE TRIGGER update_resource_signup_timestamp
  BEFORE UPDATE ON resource_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_resource_signup_timestamp();

