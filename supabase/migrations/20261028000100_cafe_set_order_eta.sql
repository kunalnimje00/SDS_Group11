-- =============================================================================
-- Migration: cafe_set_order_eta RPC
-- Allows a cafe staff member to manually set or revise the estimated ready
-- time for an order belonging to their cafe.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cafe_set_order_eta(
  p_order_id          uuid,
  p_estimated_ready_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cafe_id uuid;
BEGIN
  -- 1. Verify caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required: you must be signed in';
  END IF;

  -- 2. Get the order's cafe and verify it exists + is in an updatable status
  SELECT o.cafe_id INTO v_cafe_id
    FROM public.orders o
   WHERE o.id = p_order_id
     AND o.status NOT IN ('delivered', 'cancelled', 'rejected')
   LIMIT 1;

  IF v_cafe_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found_or_final: order does not exist or is already in a final status';
  END IF;

  -- 3. Verify the caller is staff of this cafe
  IF NOT EXISTS (
    SELECT 1 FROM public.cafe_staff
     WHERE cafe_id = v_cafe_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_cafe_staff: you are not authorized to manage this cafe''s orders';
  END IF;

  -- 4. Update estimated_ready_at (and recalculate estimated_delivery_at if destination has travel time)
  UPDATE public.orders
     SET estimated_ready_at = p_estimated_ready_at,
         estimated_delivery_at = CASE
           WHEN destination_id IS NOT NULL THEN
             p_estimated_ready_at + (
               COALESCE(
                 (SELECT d.travel_minutes FROM public.destinations d WHERE d.id = orders.destination_id),
                 0
               ) * interval '1 minute'
             )
           ELSE p_estimated_ready_at
         END,
         updated_at = now()
   WHERE id = p_order_id;
END;
$$;

-- Only authenticated users can call this; actual authorization is inside the function
REVOKE ALL ON FUNCTION public.cafe_set_order_eta(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cafe_set_order_eta(uuid, timestamptz) TO authenticated;
