-- Add approval status to resources table
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected', 'draft'));

-- Add reviewer tracking
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE resources
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE resources
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);

-- Update existing resources to be approved (backward compatibility)
UPDATE resources SET status = 'approved' WHERE status IS NULL OR status = 'pending';
