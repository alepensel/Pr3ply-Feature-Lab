
-- 1) session_participants: require auth + membership
CREATE OR REPLACE FUNCTION public.session_participants(_session_id text)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, country text, current_country text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url, p.country, p.current_country
  FROM public.bookings b
  JOIN public.profiles p ON p.user_id = b.user_id
  WHERE b.session_id = _session_id
    AND b.status = 'confirmed'
    AND auth.uid() IS NOT NULL
    AND (
      EXISTS (SELECT 1 FROM public.sessions s WHERE s.id::text = _session_id AND s.tutor_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.bookings b2 WHERE b2.session_id = _session_id AND b2.user_id = auth.uid() AND b2.status = 'confirmed')
    );
$$;

-- 2) Transcripts / feedback / audio chunks: require participant enrollment
DROP POLICY IF EXISTS "Users can insert their own transcript" ON public.session_transcripts;
CREATE POLICY "Users can insert their own transcript"
ON public.session_transcripts FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (public.is_session_participant(session_id, auth.uid()) OR public.is_session_tutor(session_id, auth.uid()))
);

DROP POLICY IF EXISTS "Users can update their own transcript" ON public.session_transcripts;
CREATE POLICY "Users can update their own transcript"
ON public.session_transcripts FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (public.is_session_participant(session_id, auth.uid()) OR public.is_session_tutor(session_id, auth.uid()))
);

DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.session_feedback;
CREATE POLICY "Users can insert their own feedback"
ON public.session_feedback FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (public.is_session_participant(session_id, auth.uid()) OR public.is_session_tutor(session_id, auth.uid()))
);

DROP POLICY IF EXISTS "Users can update their own feedback" ON public.session_feedback;
CREATE POLICY "Users can update their own feedback"
ON public.session_feedback FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (public.is_session_participant(session_id, auth.uid()) OR public.is_session_tutor(session_id, auth.uid()))
);

DROP POLICY IF EXISTS "User can insert own audio chunks" ON public.session_audio_chunks;
CREATE POLICY "User can insert own audio chunks"
ON public.session_audio_chunks FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (public.is_session_participant(session_id, auth.uid()) OR public.is_session_tutor(session_id, auth.uid()))
);

-- 3) Google Calendar tokens: restrict client-side column access.
--    RLS SELECT policies cannot filter columns, so we revoke table-level SELECT
--    from authenticated and re-grant only non-sensitive columns. Edge functions
--    keep full access via service_role.
REVOKE SELECT ON public.google_calendar_connections FROM authenticated;
GRANT SELECT (user_id, google_email, selected_calendar_id, reminder_minutes, token_expires_at, scope, created_at, updated_at)
  ON public.google_calendar_connections TO authenticated;
