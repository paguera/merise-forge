-- Create chat messages table for real-time collaboration
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read messages (for collaboration without auth)
CREATE POLICY "Anyone can read chat messages"
ON public.chat_messages
FOR SELECT
USING (true);

-- Anyone can insert messages (for collaboration without auth)
CREATE POLICY "Anyone can insert chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries by project
CREATE INDEX idx_chat_messages_project_id ON public.chat_messages(project_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;