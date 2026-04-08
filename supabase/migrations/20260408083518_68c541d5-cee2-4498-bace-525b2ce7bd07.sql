
CREATE OR REPLACE FUNCTION public.session_participants(_session_id text)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, country text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url, p.country
  FROM public.bookings b
  JOIN public.profiles p ON p.user_id = b.user_id
  WHERE b.session_id = _session_id
    AND b.status = 'confirmed'
$$;
