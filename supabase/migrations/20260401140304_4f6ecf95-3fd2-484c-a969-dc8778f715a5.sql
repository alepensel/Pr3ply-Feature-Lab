-- Drop the overly broad policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Users can see profiles of co-participants in their sessions
CREATE POLICY "Users can view co-participant profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  user_id IN (
    SELECT b2.user_id FROM public.bookings b2
    WHERE b2.session_id IN (
      SELECT b1.session_id FROM public.bookings b1 WHERE b1.user_id = auth.uid()
    )
  )
);

-- Tutors can see all profiles
CREATE POLICY "Tutors can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'tutor')
);