-- Fix is_session_tutor: guard against caller spoofing
CREATE OR REPLACE FUNCTION public.is_session_tutor(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS DISTINCT FROM auth.uid() THEN FALSE
    ELSE EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = _session_id AND tutor_id = _user_id
    )
  END;
$$;

-- Fix is_session_participant: guard against caller spoofing
CREATE OR REPLACE FUNCTION public.is_session_participant(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS DISTINCT FROM auth.uid() THEN FALSE
    ELSE EXISTS (
      SELECT 1 FROM public.bookings
      WHERE session_id = _session_id::text
        AND user_id = _user_id
        AND status = 'confirmed'
    )
  END;
$$;

-- google_calendar_connections: add INSERT policy
CREATE POLICY "Users can insert their own google calendar connection"
ON public.google_calendar_connections
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- session_feedback: add explicit ownership write policies
CREATE POLICY "Users can insert their own feedback"
ON public.session_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
ON public.session_feedback
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- session_transcripts: add explicit ownership write policies
CREATE POLICY "Users can insert their own transcript"
ON public.session_transcripts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transcript"
ON public.session_transcripts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Realtime authorization: restrict session_room_state topic to tutor or confirmed participant
-- Topic convention used by the app: "room-state-{session_id}"
CREATE POLICY "Authenticated can read room-state realtime for their sessions"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() NOT LIKE 'room-state-%')
  OR public.is_session_tutor((substring(realtime.topic() from 12))::uuid, auth.uid())
  OR public.is_session_participant((substring(realtime.topic() from 12))::uuid, auth.uid())
);
