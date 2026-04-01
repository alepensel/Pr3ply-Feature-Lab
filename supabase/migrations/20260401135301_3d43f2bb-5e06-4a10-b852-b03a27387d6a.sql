-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view session bookings" ON public.bookings;

-- Allow users to see their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Allow users to see other bookings for sessions they are also booked into
CREATE POLICY "Users can view co-participant bookings"
ON public.bookings FOR SELECT TO authenticated
USING (
  session_id IN (
    SELECT b.session_id FROM public.bookings b WHERE b.user_id = auth.uid()
  )
);

-- Allow tutors to see all bookings
CREATE POLICY "Tutors can view all bookings"
ON public.bookings FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'tutor')
);