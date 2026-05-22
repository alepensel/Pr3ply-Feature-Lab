-- Table to store per-user Google Calendar OAuth tokens and preferences
CREATE TABLE public.google_calendar_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  google_email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  selected_calendar_id TEXT NOT NULL DEFAULT 'primary',
  reminder_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connection (but tokens should ideally only be read server-side)
CREATE POLICY "Users can view their own calendar connection"
ON public.google_calendar_connections FOR SELECT
USING (auth.uid() = user_id);

-- Users can update preferences on their own connection
CREATE POLICY "Users can update their own calendar connection"
ON public.google_calendar_connections FOR UPDATE
USING (auth.uid() = user_id);

-- Only edge functions (service role) insert; deny client inserts
CREATE POLICY "Users can delete their own calendar connection"
ON public.google_calendar_connections FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_google_calendar_connections_updated_at
BEFORE UPDATE ON public.google_calendar_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();