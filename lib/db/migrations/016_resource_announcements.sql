-- Create resource_announcements table for organizer/member chat & announcements
-- Also adds muted_from_chat to resource_signups if missing

-- ── resource_announcements ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resource_announcements (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id  UUID        NOT NULL REFERENCES resources(id)  ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  content      TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_announcements_resource
  ON resource_announcements(resource_id, created_at DESC);

ALTER TABLE resource_announcements ENABLE ROW LEVEL SECURITY;

-- Resource managers / admins can read all messages for their resource
CREATE POLICY "Managers and members can view announcements"
  ON resource_announcements FOR SELECT
  USING (
    is_platform_admin()
    OR is_resource_manager(resource_id)
    OR EXISTS (
      SELECT 1 FROM resource_signups
      WHERE resource_signups.resource_id = resource_announcements.resource_id
        AND resource_signups.user_id     = auth.uid()
        AND resource_signups.status      = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM resources
      WHERE resources.id           = resource_announcements.resource_id
        AND resources.submitted_by = auth.uid()
    )
  );

-- Only resource managers / owners / admins can post
CREATE POLICY "Managers can post announcements"
  ON resource_announcements FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      is_platform_admin()
      OR is_resource_manager(resource_id)
      OR EXISTS (
        SELECT 1 FROM resources
        WHERE resources.id           = resource_announcements.resource_id
          AND resources.submitted_by = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM resource_signups
        WHERE resource_signups.resource_id = resource_announcements.resource_id
          AND resource_signups.user_id     = auth.uid()
          AND resource_signups.status      = 'approved'
          AND (resource_signups.muted_from_chat IS NULL OR resource_signups.muted_from_chat = false)
      )
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_announcements;
ALTER TABLE resource_announcements REPLICA IDENTITY FULL;

-- ── muted_from_chat on resource_signups ──────────────────────────────────────
ALTER TABLE resource_signups
  ADD COLUMN IF NOT EXISTS muted_from_chat BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE resource_signups
  ADD COLUMN IF NOT EXISTS application_data JSONB;
