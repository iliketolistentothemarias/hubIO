CREATE TABLE IF NOT EXISTS fundraising_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  organization_id UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  goal NUMERIC(12, 2) NOT NULL,
  raised NUMERIC(12, 2) DEFAULT 0,
  donors INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  image TEXT,
  end_date TIMESTAMPTZ NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES fundraising_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  message TEXT,
  anonymous BOOLEAN DEFAULT false,
  payment_method TEXT,
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_organization_id ON fundraising_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_category ON fundraising_campaigns(category);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_status ON fundraising_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);

CREATE TRIGGER update_fundraising_campaigns_updated_at
  BEFORE UPDATE ON fundraising_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
