CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'cancelled', 'waitlisted')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);
