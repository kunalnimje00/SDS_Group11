CREATE OR REPLACE FUNCTION public.register_cafe_for_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  cafe_name text;
  new_cafe_id uuid;
BEGIN
  IF COALESCE(NEW.raw_user_meta_data ->> 'cafe_signup', '') <> 'true' THEN
    RETURN NEW;
  END IF;

  cafe_name := btrim(COALESCE(NEW.raw_user_meta_data ->> 'cafe_name', ''));
  IF char_length(cafe_name) < 2 OR char_length(cafe_name) > 100 THEN
    RAISE EXCEPTION 'invalid_cafe_name';
  END IF;

  INSERT INTO public.cafes (name)
  VALUES (cafe_name)
  RETURNING id INTO new_cafe_id;

  INSERT INTO public.cafe_staff (cafe_id, user_id)
  VALUES (new_cafe_id, NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_register_cafe ON auth.users;
CREATE TRIGGER on_auth_user_created_register_cafe
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.register_cafe_for_new_auth_user();
