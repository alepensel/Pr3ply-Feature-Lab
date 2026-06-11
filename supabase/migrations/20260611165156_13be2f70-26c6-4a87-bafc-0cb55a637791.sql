DROP POLICY IF EXISTS "Authenticated can read room-state realtime for their sessions" ON realtime.messages;

CREATE POLICY "Authenticated can read room-state realtime for their sessions"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'room-state-%'
  AND (
    public.is_session_tutor((SUBSTRING(realtime.topic() FROM 12))::uuid, auth.uid())
    OR public.is_session_participant((SUBSTRING(realtime.topic() FROM 12))::uuid, auth.uid())
  )
);