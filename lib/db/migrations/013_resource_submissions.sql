-- Create a staging table for resource submissions that require admin approval
CREATE TABLE IF NOT EXISTS resource_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  tags TEXT[] DEFAULT '{}',
  hours TEXT,
  services TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  accessibility TEXT[] DEFAULT '{}',
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  admin_notes TEXT,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_submissions_status ON resource_submissions(status);
CREATE INDEX IF NOT EXISTS idx_resource_submissions_submitted_by ON resource_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_resource_submissions_created_at ON resource_submissions(created_at DESC);

ALTER TABLE resource_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit resources"
  ON resource_submissions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can view submissions"
  ON resource_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
    OR submitted_by = auth.uid()
  );

CREATE POLICY "Admins can process submissions"
  ON resource_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete submissions"
  ON resource_submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_resource_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resource_submissions_updated_at
  BEFORE UPDATE ON resource_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_submissions_updated_at();

