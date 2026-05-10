-- 1) Restrict user_session_ids to the calling user
CREATE OR REPLACE FUNCTION public.user_session_ids(_user_id uuid)
  RETURNS SETOF text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT session_id FROM public.bookings
  WHERE user_id = _user_id
    AND _user_id = auth.uid();
$$;

-- 2) Lock down sessions table; expose a safe public view without meet_link
DROP POLICY IF EXISTS "Anyone can view sessions" ON public.sessions;

CREATE POLICY "Participants and tutor can view full session"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (
    tutor_id = auth.uid()
    OR id::text IN (
      SELECT session_id FROM public.bookings
      WHERE user_id = auth.uid() AND status = 'confirmed'
    )
  );

CREATE OR REPLACE VIEW public.public_sessions
WITH (security_invoker = true) AS
SELECT
  id, tutor_id, theme, scenario, description, language, level,
  duration, price, max_spots, next_session, scheduled_at,
  created_at, updated_at
FROM public.sessions;

-- View needs a permissive read path since the underlying table now restricts SELECT
CREATE POLICY "Public listing access for view"
  ON public.sessions FOR SELECT
  TO anon, authenticated
  USING (current_setting('lovable.public_view', true) IS NOT NULL);
-- The above is a no-op gate; instead grant via view directly:
DROP POLICY IF EXISTS "Public listing access for view" ON public.sessions;

GRANT SELECT ON public.public_sessions TO anon, authenticated;