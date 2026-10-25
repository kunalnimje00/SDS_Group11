-- Migration: 20261025000100_cafe_staff_manage_menu.sql
-- Enables cafe staff (cafeteria administrators) to add, update, and delete dishes for their cafe

-- 1. Add Dish RPC
CREATE OR REPLACE FUNCTION public.cafe_add_menu_item(
  p_name text,
  p_description text,
  p_price_paise integer,
  p_prep_minutes integer DEFAULT 10,
  p_category text DEFAULT NULL,
  p_is_available boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_user_id uuid := auth.uid();
  staff_cafe_id uuid;
  new_item_id uuid;
BEGIN
  IF caller_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT cafe_id INTO staff_cafe_id
  FROM public.cafe_staff
  WHERE user_id = caller_user_id;

  IF staff_cafe_id IS NULL THEN
    RAISE EXCEPTION 'not_cafe_staff';
  END IF;

  IF btrim(COALESCE(p_name, '')) = '' THEN
    RAISE EXCEPTION 'invalid_item_name';
  END IF;

  IF p_price_paise IS NULL OR p_price_paise <= 0 THEN
    RAISE EXCEPTION 'invalid_price';
  END IF;

  INSERT INTO public.menu_items (
    cafe_id,
    name,
    description,
    price_paise,
    prep_minutes,
    category,
    is_available
  ) VALUES (
    staff_cafe_id,
    btrim(p_name),
    btrim(COALESCE(p_description, '')),
    p_price_paise,
    COALESCE(p_prep_minutes, 10),
    NULLIF(btrim(COALESCE(p_category, '')), ''),
    COALESCE(p_is_available, true)
  )
  RETURNING id INTO new_item_id;

  RETURN new_item_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cafe_add_menu_item(text, text, integer, integer, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cafe_add_menu_item(text, text, integer, integer, text, boolean) TO authenticated;

-- 2. Update Dish RPC
CREATE OR REPLACE FUNCTION public.cafe_update_menu_item(
  p_item_id uuid,
  p_name text,
  p_description text,
  p_price_paise integer,
  p_prep_minutes integer,
  p_category text,
  p_is_available boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_user_id uuid := auth.uid();
  staff_cafe_id uuid;
BEGIN
  IF caller_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT cafe_id INTO staff_cafe_id
  FROM public.cafe_staff
  WHERE user_id = caller_user_id;

  IF staff_cafe_id IS NULL THEN
    RAISE EXCEPTION 'not_cafe_staff';
  END IF;

  UPDATE public.menu_items
  SET
    name = COALESCE(NULLIF(btrim(p_name), ''), name),
    description = COALESCE(btrim(p_description), description),
    price_paise = COALESCE(p_price_paise, price_paise),
    prep_minutes = COALESCE(p_prep_minutes, prep_minutes),
    category = NULLIF(btrim(COALESCE(p_category, '')), ''),
    is_available = COALESCE(p_is_available, is_available)
  WHERE id = p_item_id AND cafe_id = staff_cafe_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'item_not_found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.cafe_update_menu_item(uuid, text, text, integer, integer, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cafe_update_menu_item(uuid, text, text, integer, integer, text, boolean) TO authenticated;

-- 3. Delete Dish RPC
CREATE OR REPLACE FUNCTION public.cafe_delete_menu_item(p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_user_id uuid := auth.uid();
  staff_cafe_id uuid;
BEGIN
  IF caller_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT cafe_id INTO staff_cafe_id
  FROM public.cafe_staff
  WHERE user_id = caller_user_id;

  IF staff_cafe_id IS NULL THEN
    RAISE EXCEPTION 'not_cafe_staff';
  END IF;

  DELETE FROM public.menu_items
  WHERE id = p_item_id AND cafe_id = staff_cafe_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'item_not_found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.cafe_delete_menu_item(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cafe_delete_menu_item(uuid) TO authenticated;

-- 4. Enable RLS policy for direct table operations by cafe staff
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'menu_items' AND policyname = 'cafe_staff_manage_menu_items'
  ) THEN
    CREATE POLICY cafe_staff_manage_menu_items
      ON public.menu_items
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.cafe_staff
          WHERE cafe_staff.cafe_id = menu_items.cafe_id
            AND cafe_staff.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.cafe_staff
          WHERE cafe_staff.cafe_id = menu_items.cafe_id
            AND cafe_staff.user_id = auth.uid()
        )
      );
  END IF;
END
$$;
