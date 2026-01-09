-- Create volunteer_opportunities table
CREATE TABLE IF NOT EXISTS public.volunteer_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organization TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  category TEXT NOT NULL,
  location JSONB,
  skills_required TEXT[] DEFAULT '{}',
  time_commitment TEXT,
  age_requirement TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_category ON public.volunteer_opportunities(category);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_status ON public.volunteer_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_organization ON public.volunteer_opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_created_at ON public.volunteer_opportunities(created_at DESC);

-- Enable RLS
ALTER TABLE public.volunteer_opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view volunteer opportunities"
  ON public.volunteer_opportunities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert volunteer opportunities"
  ON public.volunteer_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own volunteer opportunities"
  ON public.volunteer_opportunities FOR UPDATE
  TO authenticated
  USING (organization_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete volunteer opportunities"
  ON public.volunteer_opportunities FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_volunteer_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_volunteer_opportunities_updated_at ON public.volunteer_opportunities;
CREATE TRIGGER update_volunteer_opportunities_updated_at
  BEFORE UPDATE ON public.volunteer_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_volunteer_opportunities_updated_at();

