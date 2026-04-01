-- Drop the overly broad policy
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;