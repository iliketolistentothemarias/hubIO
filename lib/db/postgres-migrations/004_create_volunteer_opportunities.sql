CREATE TABLE IF NOT EXISTS volunteer_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  organization_id UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  time_commitment TEXT NOT NULL,
  location TEXT NOT NULL,
  location_coords JSONB,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  spots_available INTEGER,
  spots_filled INTEGER DEFAULT 0,
  impact_area TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  recurring BOOLEAN DEFAULT false,
  image TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_category ON volunteer_opportunities(category);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_status ON volunteer_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_organization_id ON volunteer_opportunities(organization_id);

CREATE TRIGGER update_volunteer_opportunities_updated_at
  BEFORE UPDATE ON volunteer_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
