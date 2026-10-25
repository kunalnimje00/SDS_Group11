CREATE OR REPLACE FUNCTION public.cafe_complete_registration(p_cafe_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  cafe_name text := btrim(COALESCE(p_cafe_name, ''));
  new_cafe_id uuid;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF char_length(cafe_name) < 2 OR char_length(cafe_name) > 100 THEN
    RAISE EXCEPTION 'invalid_cafe_name';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.cafe_staff
    WHERE user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'cafe_registration_already_completed';
  END IF;

  INSERT INTO public.cafes (name)
  VALUES (cafe_name)
  RETURNING id INTO new_cafe_id;

  INSERT INTO public.cafe_staff (cafe_id, user_id)
  VALUES (new_cafe_id, current_user_id);

  RETURN new_cafe_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cafe_complete_registration(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cafe_complete_registration(text) TO authenticated;
