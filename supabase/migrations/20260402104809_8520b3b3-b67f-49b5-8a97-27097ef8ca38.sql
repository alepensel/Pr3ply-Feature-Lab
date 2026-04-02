
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  theme text NOT NULL,
  scenario text NOT NULL,
  description text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'English',
  level text NOT NULL DEFAULT 'B1',
  duration text NOT NULL DEFAULT '45 min',
  price numeric NOT NULL DEFAULT 16,
  max_spots integer NOT NULL DEFAULT 2,
  next_session text NOT NULL DEFAULT '',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  meet_link text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can view sessions (public listing)
CREATE POLICY "Anyone can view sessions"
ON public.sessions FOR SELECT
TO public
USING (true);

-- Tutors can create their own sessions
CREATE POLICY "Tutors can create sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = tutor_id
  AND public.has_role(auth.uid(), 'tutor')
);

-- Tutors can update their own sessions
CREATE POLICY "Tutors can update sessions"
ON public.sessions FOR UPDATE
TO authenticated
USING (
  auth.uid() = tutor_id
  AND public.has_role(auth.uid(), 'tutor')
);

-- Tutors can delete their own sessions
CREATE POLICY "Tutors can delete sessions"
ON public.sessions FOR DELETE
TO authenticated
USING (
  auth.uid() = tutor_id
  AND public.has_role(auth.uid(), 'tutor')
);

-- Auto-update updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
