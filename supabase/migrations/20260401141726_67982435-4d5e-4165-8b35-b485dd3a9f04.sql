
-- Create a security definer function to check if a user has a booking in a given session
CREATE OR REPLACE FUNCTION public.user_session_ids(_user_id uuid)
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT session_id FROM public.bookings WHERE user_id = _user_id
$$;

-- Drop the recursive co-participant bookings policy
DROP POLICY IF EXISTS "Users can view co-participant bookings" ON public.bookings;

-- Recreate using the security definer function
CREATE POLICY "Users can view co-participant bookings"
ON public.bookings FOR SELECT TO authenticated
USING (session_id IN (SELECT public.user_session_ids(auth.uid())));

-- Also fix the profiles co-participant policy which chains into bookings
DROP POLICY IF EXISTS "Users can view co-participant profiles" ON public.profiles;

CREATE POLICY "Users can view co-participant profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  user_id IN (
    SELECT b.user_id FROM public.bookings b
    WHERE b.session_id IN (SELECT public.user_session_ids(auth.uid()))
  )
);
