-- Align resources with admin approval flow (required for publishing from resource_submissions).
-- Safe to run if columns already exist (e.g. after postgres-migrations/010).

ALTER TABLE resources
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected', 'draft'));

ALTER TABLE resources
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE resources
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE resources
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);

-- Legacy rows that were already public (verified) should stay publishable
UPDATE resources SET status = 'approved' WHERE verified = true AND status = 'pending';
