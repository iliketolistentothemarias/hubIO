-- Migration 015: Event visibility, private applications, and event announcements channel

-- Add visibility and application fields to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS application_question TEXT,
  ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES auth.users(id);

-- Update event_registrations for private-event applications
-- approval_status: 'approved' = immediate (public events), 'pending' = awaiting organizer review (private)
ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS application_data JSONB,
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('approved', 'pending', 'rejected'));

-- Create event_announcements table (group chat channel per event)
CREATE TABLE IF NOT EXISTS event_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: only approved participants (or organizer) can read/write
ALTER TABLE event_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read announcements" ON event_announcements;
CREATE POLICY "Participants can read announcements"
  ON event_announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_registrations er
      WHERE er.event_id = event_announcements.event_id
        AND er.user_id = auth.uid()
        AND er.approval_status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_announcements.event_id
        AND e.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can post announcements" ON event_announcements;
CREATE POLICY "Participants can post announcements"
  ON event_announcements FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM event_registrations er
        WHERE er.event_id = event_announcements.event_id
          AND er.user_id = auth.uid()
          AND er.approval_status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_announcements.event_id
          AND e.organizer_id = auth.uid()
      )
    )
  );

-- Add event_announcements to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE event_announcements;
