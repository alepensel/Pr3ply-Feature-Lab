-- Explicit restrictive policies on user_roles to prevent self-assignment
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;

CREATE POLICY "No self insert into user_roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "No self update of user_roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "No self delete of user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (false);

-- Restrict co-participant visibility to confirmed bookings only
CREATE OR REPLACE FUNCTION public.user_session_ids(_user_id uuid)
RETURNS SETOF text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT session_id FROM public.bookings
  WHERE user_id = _user_id
    AND _user_id = auth.uid()
    AND status = 'confirmed';
$function$;