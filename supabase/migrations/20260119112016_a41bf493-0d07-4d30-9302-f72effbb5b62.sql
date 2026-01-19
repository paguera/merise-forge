-- Table: projects (collaboration temps réel par projet nommé)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Public (pas d'auth obligatoire pour v1 locale)
CREATE POLICY "Anyone can read projects"
  ON public.projects FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update projects"
  ON public.projects FOR UPDATE
  USING (true);

-- update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_projects_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;