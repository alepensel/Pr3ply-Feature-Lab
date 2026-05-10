DROP VIEW IF EXISTS public.public_sessions;

CREATE VIEW public.public_sessions
WITH (security_invoker = false) AS
SELECT
  id, tutor_id, theme, scenario, description, language, level,
  duration, price, max_spots, next_session, scheduled_at,
  created_at, updated_at
FROM public.sessions;

GRANT SELECT ON public.public_sessions TO anon, authenticated;