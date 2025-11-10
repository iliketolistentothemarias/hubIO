-- Create resources table if it doesn't exist
-- This table stores community resources (organizations, services, etc.)

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  location JSONB,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3, 2),
  review_count INTEGER DEFAULT 0,
  hours TEXT,
  services TEXT[],
  capacity INTEGER,
  languages TEXT[],
  accessibility TEXT[],
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_verified ON resources(verified);
CREATE INDEX IF NOT EXISTS idx_resources_featured ON resources(featured);
CREATE INDEX IF NOT EXISTS idx_resources_submitted_by ON resources(submitted_by);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Anyone can view verified resources
CREATE POLICY "Anyone can view verified resources"
  ON resources FOR SELECT
  USING (verified = true);

-- Authenticated users can view all resources (including pending)
CREATE POLICY "Authenticated users can view all resources"
  ON resources FOR SELECT
  USING (auth.role() = 'authenticated');

-- Anyone can insert resources (for submissions)
CREATE POLICY "Anyone can insert resources"
  ON resources FOR INSERT
  WITH CHECK (true);

-- Only admins and moderators can update resources
CREATE POLICY "Admins can update resources"
  ON resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

-- Only admins and moderators can delete resources
CREATE POLICY "Admins can delete resources"
  ON resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_resources_updated_at();

