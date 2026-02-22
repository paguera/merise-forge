
-- Add creator_user_id (UUID) and is_public (boolean) to projects
ALTER TABLE public.projects
  ADD COLUMN creator_user_id uuid,
  ADD COLUMN is_public boolean NOT NULL DEFAULT true;

-- Allow delete for project owners
CREATE POLICY "Owner can delete projects"
  ON public.projects
  FOR DELETE
  USING (creator_user_id = auth.uid());
