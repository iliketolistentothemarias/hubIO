-- Create fundraising_campaigns table
CREATE TABLE IF NOT EXISTS public.fundraising_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  goal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  raised DECIMAL(10, 2) NOT NULL DEFAULT 0,
  donors INTEGER NOT NULL DEFAULT 0,
  organizer TEXT,
  organizer_id TEXT,
  location JSONB,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_category ON public.fundraising_campaigns(category);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_status ON public.fundraising_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_organizer ON public.fundraising_campaigns(organizer_id);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_created_at ON public.fundraising_campaigns(created_at DESC);

-- Enable RLS
ALTER TABLE public.fundraising_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view fundraising campaigns"
  ON public.fundraising_campaigns FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert fundraising campaigns"
  ON public.fundraising_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own fundraising campaigns"
  ON public.fundraising_campaigns FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete fundraising campaigns"
  ON public.fundraising_campaigns FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_fundraising_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_fundraising_campaigns_updated_at ON public.fundraising_campaigns;
CREATE TRIGGER update_fundraising_campaigns_updated_at
  BEFORE UPDATE ON public.fundraising_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fundraising_campaigns_updated_at();

