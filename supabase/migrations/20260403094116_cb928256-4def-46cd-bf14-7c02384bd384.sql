
-- Security definer function to get booking counts (bypasses RLS so all users see accurate spot counts)
CREATE OR REPLACE FUNCTION public.session_booking_counts(_session_ids text[])
RETURNS TABLE(session_id text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.session_id, COUNT(*)::bigint
  FROM public.bookings b
  WHERE b.session_id = ANY(_session_ids)
    AND b.status = 'confirmed'
  GROUP BY b.session_id
$$;

-- Clean up stale bookings with old mock IDs (non-UUID format)
DELETE FROM public.bookings
WHERE session_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
