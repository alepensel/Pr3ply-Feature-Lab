CREATE OR REPLACE FUNCTION public.check_session_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  spots  integer;
  booked integer;
BEGIN
  IF NEW.status <> 'confirmed' THEN
    RETURN NEW;
  END IF;

  SELECT max_spots INTO spots
  FROM public.sessions
  WHERE id::text = NEW.session_id
  FOR UPDATE;

  IF spots IS NULL THEN
    RAISE EXCEPTION 'session not found';
  END IF;

  SELECT COUNT(*) INTO booked
  FROM public.bookings
  WHERE session_id = NEW.session_id
    AND status = 'confirmed';

  IF booked >= spots THEN
    RAISE EXCEPTION 'session is full';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_max_spots ON public.bookings;
CREATE TRIGGER enforce_max_spots
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.check_session_capacity();