-- Add creator tracking and admin role to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS creator_id text,
ADD COLUMN IF NOT EXISTS current_schema_id uuid;

-- Create schemas table (multiple named schemas per project)
CREATE TABLE public.project_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by text NOT NULL
);

-- Create sync history table
CREATE TABLE public.sync_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  schema_id uuid REFERENCES public.project_schemas(id) ON DELETE CASCADE,
  username text NOT NULL,
  action_type text NOT NULL, -- 'add_entity', 'update_entity', 'remove_entity', 'add_relation', etc.
  action_summary text NOT NULL, -- Human readable description
  changes_detail jsonb NOT NULL DEFAULT '{}'::jsonb, -- Before/after data
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb, -- Full schema snapshot at this point
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_at timestamp with time zone,
  reviewed_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_schemas
CREATE POLICY "Anyone can read project schemas"
ON public.project_schemas
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert project schemas"
ON public.project_schemas
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update project schemas"
ON public.project_schemas
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete project schemas"
ON public.project_schemas
FOR DELETE
USING (true);

-- RLS policies for sync_history
CREATE POLICY "Anyone can read sync history"
ON public.sync_history
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert sync history"
ON public.sync_history
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Project creator can update sync history"
ON public.sync_history
FOR UPDATE
USING (true);

-- Trigger for updated_at on project_schemas
CREATE TRIGGER update_project_schemas_updated_at
BEFORE UPDATE ON public.project_schemas
FOR EACH ROW
EXECUTE FUNCTION public.update_projects_updated_at();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_schemas;