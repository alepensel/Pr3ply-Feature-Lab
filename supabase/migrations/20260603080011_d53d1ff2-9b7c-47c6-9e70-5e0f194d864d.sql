-- Helper: check if user is the tutor of a given session
CREATE OR REPLACE FUNCTION public.is_session_tutor(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions
    WHERE id = _session_id AND tutor_id = _user_id
  );
$$;

-- Helper: check if user has a confirmed booking on a given session
CREATE OR REPLACE FUNCTION public.is_session_participant(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE session_id = _session_id::text
      AND user_id = _user_id
      AND status = 'confirmed'
  );
$$;

-- =========================================================
-- 1) session_roleplay_prompts
-- =========================================================
CREATE TABLE public.session_roleplay_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  prompts JSONB NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_roleplay_prompts TO authenticated;
GRANT ALL ON public.session_roleplay_prompts TO service_role;

ALTER TABLE public.session_roleplay_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutor and participants can read prompts"
ON public.session_roleplay_prompts FOR SELECT
USING (
  public.is_session_tutor(session_id, auth.uid())
  OR public.is_session_participant(session_id, auth.uid())
);

CREATE POLICY "Tutor can insert prompts"
ON public.session_roleplay_prompts FOR INSERT
WITH CHECK (public.is_session_tutor(session_id, auth.uid()));

CREATE POLICY "Tutor can update prompts"
ON public.session_roleplay_prompts FOR UPDATE
USING (public.is_session_tutor(session_id, auth.uid()));

CREATE POLICY "Tutor can delete prompts"
ON public.session_roleplay_prompts FOR DELETE
USING (public.is_session_tutor(session_id, auth.uid()));

CREATE TRIGGER update_session_roleplay_prompts_updated_at
BEFORE UPDATE ON public.session_roleplay_prompts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 2) session_room_state
-- =========================================================
CREATE TABLE public.session_room_state (
  session_id UUID NOT NULL PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
  current_prompt_index INTEGER NOT NULL DEFAULT 0,
  current_speaker_id UUID,
  turn_started_at TIMESTAMPTZ,
  turn_duration_seconds INTEGER NOT NULL DEFAULT 60,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  session_ended BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_room_state TO authenticated;
GRANT ALL ON public.session_room_state TO service_role;

ALTER TABLE public.session_room_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutor and participants can read room state"
ON public.session_room_state FOR SELECT
USING (
  public.is_session_tutor(session_id, auth.uid())
  OR public.is_session_participant(session_id, auth.uid())
);

CREATE POLICY "Tutor can insert room state"
ON public.session_room_state FOR INSERT
WITH CHECK (public.is_session_tutor(session_id, auth.uid()));

CREATE POLICY "Tutor can update room state"
ON public.session_room_state FOR UPDATE
USING (public.is_session_tutor(session_id, auth.uid()));

CREATE TRIGGER update_session_room_state_updated_at
BEFORE UPDATE ON public.session_room_state
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.session_room_state;
ALTER TABLE public.session_room_state REPLICA IDENTITY FULL;

-- =========================================================
-- 3) session_audio_chunks
-- =========================================================
CREATE TABLE public.session_audio_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  path TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_audio_chunks_session_user
  ON public.session_audio_chunks(session_id, user_id, chunk_index);

GRANT SELECT, INSERT, DELETE ON public.session_audio_chunks TO authenticated;
GRANT ALL ON public.session_audio_chunks TO service_role;

ALTER TABLE public.session_audio_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or tutor can read audio chunks"
ON public.session_audio_chunks FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_session_tutor(session_id, auth.uid())
);

CREATE POLICY "User can insert own audio chunks"
ON public.session_audio_chunks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete own audio chunks"
ON public.session_audio_chunks FOR DELETE
USING (auth.uid() = user_id);

-- =========================================================
-- 4) session_transcripts
-- =========================================================
CREATE TABLE public.session_transcripts (
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  segments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

GRANT SELECT ON public.session_transcripts TO authenticated;
GRANT ALL ON public.session_transcripts TO service_role;

ALTER TABLE public.session_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or tutor can read transcript"
ON public.session_transcripts FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_session_tutor(session_id, auth.uid())
);

CREATE TRIGGER update_session_transcripts_updated_at
BEFORE UPDATE ON public.session_transcripts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 5) session_feedback
-- =========================================================
CREATE TABLE public.session_feedback (
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  report JSONB NOT NULL,
  score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

GRANT SELECT ON public.session_feedback TO authenticated;
GRANT ALL ON public.session_feedback TO service_role;

ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or tutor can read feedback"
ON public.session_feedback FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_session_tutor(session_id, auth.uid())
);

CREATE TRIGGER update_session_feedback_updated_at
BEFORE UPDATE ON public.session_feedback
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 6) Storage policies for session-recordings bucket
-- =========================================================
-- Path format: sessions/{session_id}/{user_id}/{chunk_index}.webm
-- foldername(name) -> ['sessions', '{session_id}', '{user_id}', '{chunk}.webm']

CREATE POLICY "User can upload own session recording chunks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'session-recordings'
  AND (storage.foldername(name))[1] = 'sessions'
  AND auth.uid()::text = (storage.foldername(name))[3]
);

CREATE POLICY "Owner can read own session recording chunks"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'session-recordings'
  AND (storage.foldername(name))[1] = 'sessions'
  AND auth.uid()::text = (storage.foldername(name))[3]
);

CREATE POLICY "Tutor can read recording chunks for own session"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'session-recordings'
  AND (storage.foldername(name))[1] = 'sessions'
  AND public.is_session_tutor(((storage.foldername(name))[2])::uuid, auth.uid())
);

CREATE POLICY "Owner can delete own session recording chunks"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'session-recordings'
  AND (storage.foldername(name))[1] = 'sessions'
  AND auth.uid()::text = (storage.foldername(name))[3]
);