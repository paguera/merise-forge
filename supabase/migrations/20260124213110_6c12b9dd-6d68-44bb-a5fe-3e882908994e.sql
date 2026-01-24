-- Table for site settings (logo, etc.) - Only super admin can modify
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Default site settings
INSERT INTO public.site_settings (key, value) VALUES 
  ('logo_url', NULL),
  ('site_name', 'Ressou Merise'),
  ('announcement_text', NULL),
  ('announcement_active', 'false');

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage site settings"
ON public.site_settings FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Table for global notifications from super admin
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- info, warning, success, announcement
  target_type text NOT NULL DEFAULT 'all', -- all, project, user
  target_id uuid, -- project_id or user_id if targeted
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active notifications"
ON public.notifications FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage notifications"
ON public.notifications FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Table to track which users have seen which notifications
CREATE TABLE public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamp with time zone DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reads"
ON public.notification_reads FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can mark notifications as read"
ON public.notification_reads FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Table for support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  priority text NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tickets"
ON public.support_tickets FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all tickets"
ON public.support_tickets FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update tickets"
ON public.support_tickets FOR UPDATE
USING (is_admin(auth.uid()));

-- Table for ticket responses
CREATE TABLE public.ticket_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  message text NOT NULL,
  is_admin_response boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses on their tickets"
ON public.ticket_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

CREATE POLICY "Users can respond to their tickets"
ON public.ticket_responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

-- Add description field to projects for Merise explanations
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS collaborator_count integer DEFAULT 0;

-- Create trigger to update collaborator_count
CREATE OR REPLACE FUNCTION public.update_project_collaborator_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects 
  SET collaborator_count = (
    SELECT COUNT(DISTINCT username) 
    FROM public.project_user_stats 
    WHERE project_id = NEW.project_id
  )
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_collaborator_count_trigger
AFTER INSERT OR UPDATE ON public.project_user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_project_collaborator_count();