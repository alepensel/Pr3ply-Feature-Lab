
-- Allow authenticated users to view all bookings for a session (to see who's joining)
CREATE POLICY "Authenticated users can view session bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
