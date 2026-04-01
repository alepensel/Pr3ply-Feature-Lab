
-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'tutor', 'student');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: authenticated users can read roles
CREATE POLICY "Authenticated users can view roles"
ON public.user_roles FOR SELECT TO authenticated
USING (true);

-- RLS: only admins can manage roles (for now, we'll insert via migration)
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO public
USING (auth.uid() = user_id);
