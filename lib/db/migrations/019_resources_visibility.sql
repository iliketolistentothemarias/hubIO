-- Organizer join visibility (used by /api/resources/[id]/join and PATCH)
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public', 'private'));

ALTER TABLE resources
ADD COLUMN IF NOT EXISTS application_question TEXT;
