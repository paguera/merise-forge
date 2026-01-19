-- Create emoji reactions table for chat messages
CREATE TABLE public.chat_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, username, emoji)
);

-- Enable RLS
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions
CREATE POLICY "Anyone can read chat reactions"
ON public.chat_reactions
FOR SELECT
USING (true);

-- Anyone can insert reactions
CREATE POLICY "Anyone can insert chat reactions"
ON public.chat_reactions
FOR INSERT
WITH CHECK (true);

-- Anyone can delete their own reactions
CREATE POLICY "Anyone can delete their reactions"
ON public.chat_reactions
FOR DELETE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_chat_reactions_message_id ON public.chat_reactions(message_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;