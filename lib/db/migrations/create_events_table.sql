-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location JSONB,
  organizer TEXT NOT NULL,
  organizer_id TEXT NOT NULL,
  capacity INTEGER,
  registered INTEGER NOT NULL DEFAULT 0,
  rsvp_required BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_events_updated_at();

