DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.cafe_staff
    GROUP BY cafe_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'cafe_staff has multiple accounts assigned to a cafe; resolve duplicates before applying this migration';
  END IF;
END
$$;

CREATE UNIQUE INDEX cafe_staff_one_login_per_cafe_idx
  ON public.cafe_staff (cafe_id);
