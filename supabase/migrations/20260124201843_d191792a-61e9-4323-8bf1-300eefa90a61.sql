-- Create table to track user connections and activity per project
CREATE TABLE public.project_user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  connection_count INTEGER NOT NULL DEFAULT 1,
  modification_count INTEGER NOT NULL DEFAULT 0,
  first_connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, username)
);

-- Enable RLS
ALTER TABLE public.project_user_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read stats for a project
CREATE POLICY "Anyone can read project user stats"
ON public.project_user_stats
FOR SELECT
USING (true);

-- Allow anyone to insert their own stats
CREATE POLICY "Anyone can insert their own stats"
ON public.project_user_stats
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update their own stats
CREATE POLICY "Anyone can update their own stats"
ON public.project_user_stats
FOR UPDATE
USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_user_stats;