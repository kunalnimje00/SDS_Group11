-- ============================================================================
-- SQL Script: Remove Duplicate Cafe & Keep Only Original Meta Canteen
-- Description:
--   1. Deletes the extra cafe ('c0ffee00-0000-4000-8000-000000000001')
--   2. Keeps the original Meta Canteen
--   3. Attaches all 45 official menu items to the original Meta Canteen
-- Execute in: Supabase Dashboard -> SQL Editor
-- ============================================================================

-- Step 1: Move any menu items from the duplicate cafe to the original Meta Canteen
UPDATE public.menu_items
SET cafe_id = (
  SELECT id FROM public.cafes 
  WHERE id != 'c0ffee00-0000-4000-8000-000000000001' 
    AND lower(name) LIKE '%meta%'
  LIMIT 1
)
WHERE cafe_id = 'c0ffee00-0000-4000-8000-000000000001'
  AND EXISTS (
    SELECT 1 FROM public.cafes 
    WHERE id != 'c0ffee00-0000-4000-8000-000000000001' 
      AND lower(name) LIKE '%meta%'
  );

-- Step 2: Delete any dependent records tied to the duplicate cafe
DELETE FROM public.menu_item_availability 
WHERE menu_item_id IN (
  SELECT id FROM public.menu_items WHERE cafe_id = 'c0ffee00-0000-4000-8000-000000000001'
);

DELETE FROM public.menu_items 
WHERE cafe_id = 'c0ffee00-0000-4000-8000-000000000001';

DELETE FROM public.cafe_hours 
WHERE cafe_id = 'c0ffee00-0000-4000-8000-000000000001';

DELETE FROM public.cafe_staff 
WHERE cafe_id = 'c0ffee00-0000-4000-8000-000000000001';

-- Step 3: Delete the extra duplicate cafe itself
DELETE FROM public.cafes 
WHERE id = 'c0ffee00-0000-4000-8000-000000000001';

-- Step 4: Ensure all 45 items are present in the original Meta Canteen
INSERT INTO public.menu_items (cafe_id, name, description, price_paise, prep_minutes, category, is_available)
SELECT 
  c.id, 
  v.name, 
  v.description, 
  v.price_paise, 
  v.prep_minutes, 
  v.category, 
  true
FROM (
  SELECT id FROM public.cafes 
  WHERE lower(name) LIKE '%meta%' 
  LIMIT 1
) c
CROSS JOIN (
  VALUES
    -- SNACKS
    ('Poha', 'Traditional spiced flattened rice', 2500, 5, 'Snacks'),
    ('Upma', 'Savory roasted semolina porridge', 2500, 5, 'Snacks'),
    ('Misal Pav', 'Spicy sprouted bean curry served with pav', 8000, 10, 'Snacks'),
    ('Sabudana Vada', 'Crispy sago fritters served with chutney', 4000, 8, 'Snacks'),
    ('Idli Sambar', 'Steamed rice cakes served with hot sambar and chutney', 4000, 5, 'Snacks'),
    ('Medu Vada Sambar', 'Crisp lentil donuts served with sambar and chutney', 6000, 8, 'Snacks'),
    ('Batata Vada Sambar', 'Spiced potato fritters served with sambar and chutney', 6000, 8, 'Snacks'),
    ('Corn Cutlet (2 pcs)', 'Crisp golden sweet corn patties (2 pcs)', 7000, 10, 'Snacks'),
    ('French Fries', 'Classic crispy golden potato fries', 7000, 8, 'Snacks'),
    ('Peri-Peri Fries', 'Crispy fries tossed in zesty peri-peri seasoning', 8000, 8, 'Snacks'),

    -- EGG
    ('Egg Omelette', 'Fluffy seasoned pan-fried egg omelette', 6000, 8, 'Egg'),
    ('Egg Bhurji', 'Indian style spiced scrambled eggs', 8000, 10, 'Egg'),
    ('Egg Rice', 'Stir-fried rice tossed with eggs and mild spices', 10000, 12, 'Egg'),
    ('Egg Noodles', 'Wok-tossed noodles with scrambled eggs and vegetables', 10000, 12, 'Egg'),
    ('Egg Schezwan Noodles', 'Spicy wok noodles tossed with eggs and schezwan sauce', 11000, 12, 'Egg'),

    -- CHINESE RICE
    ('Veg Fried Rice', 'Aromatic wok-tossed fried rice with farm vegetables', 9000, 12, 'Chinese Rice'),
    ('Veg Schezwan Rice', 'Spicy wok-tossed rice with vegetables in fiery schezwan sauce', 9000, 12, 'Chinese Rice'),
    ('Veg Manchurian Rice', 'Fried rice served with savoury vegetable Manchurian balls', 9000, 15, 'Chinese Rice'),

    -- CHINESE NOODLES
    ('Veg Hakka Noodles', 'Classic wok noodles with crisp shredded vegetables', 8000, 10, 'Chinese Noodles'),
    ('Veg Schezwan Noodles', 'Stir-fried noodles in hot and zesty schezwan sauce', 8500, 10, 'Chinese Noodles'),
    ('Veg Manchurian Noodles', 'Wok noodles tossed with vegetable Manchurian balls', 9000, 15, 'Chinese Noodles'),

    -- RICE
    ('Veg Pulao', 'Fragrant basmati rice cooked with garden vegetables and whole spices', 7000, 10, 'Rice'),
    ('Paneer Pulao', 'Basmati rice cooked with succulent spiced paneer cubes', 8000, 12, 'Rice'),
    ('Dal Khichdi', 'Comforting lentil and rice pot tempered with ghee and cumin', 9000, 15, 'Rice'),
    ('Green Peas Pulao', 'Aromatic rice cooked with tender sweet green peas', 8000, 10, 'Rice'),
    ('Jeera Rice', 'Fluffy basmati rice tempered with roasted cumin seeds', 7000, 8, 'Rice'),

    -- SANDWICHES
    ('Veg Cheese Grilled Sandwich', 'Toasted triple-layer sandwich with spiced veggies and melted cheese', 8000, 10, 'Sandwiches'),
    ('Veg Paneer Grilled Sandwich', 'Grilled sandwich loaded with marinated paneer and chutney', 9000, 10, 'Sandwiches'),
    ('Veg Schezwan Grilled Sandwich', 'Crispy grilled sandwich with crunchy vegetables and spicy schezwan spread', 8500, 10, 'Sandwiches'),
    ('Egg Toast', 'Golden grilled buttered bread toast with seasoned egg stuffing', 10000, 8, 'Sandwiches'),

    -- ROLLS
    ('Veg Roll', 'Warm flatbread wrap filled with spiced vegetable sauté', 5000, 10, 'Rolls'),
    ('Paneer Roll', 'Flaky flatbread roll stuffed with seasoned paneer and onions', 7000, 10, 'Rolls'),
    ('Egg Roll', 'Crisp flatbread wrap layered with beaten egg and tangy filling', 7000, 10, 'Rolls'),

    -- PARATHAS
    ('Aloo Paratha', 'Whole wheat flatbread stuffed with spiced mashed potatoes', 7000, 12, 'Parathas'),
    ('Paneer Paratha', 'Wholesome paratha stuffed with grated spiced cottage cheese', 9000, 12, 'Parathas'),

    -- VEG THALI
    ('Veg Thali', 'Dal, Rice, 2 Chapatis, 2 Sabjis, Papad or Salad', 8000, 15, 'Veg Thali'),
    ('Veg Paneer Thali', 'Dal, Rice, Chapati, Paneer Sabji, Papad or Salad; choice of Pulao, Jeera Rice or Green Peas Pulao', 11000, 15, 'Veg Thali'),

    -- NON-VEG RICE
    ('Chicken Fried Rice', 'Wok-tossed rice with shredded tender chicken and aromatics', 14000, 15, 'Non-Veg Rice'),
    ('Chicken Schezwan Rice', 'Spicy wok rice tossed with juicy chicken bites and schezwan sauce', 15000, 15, 'Non-Veg Rice'),

    -- NON-VEG NOODLES
    ('Chicken Hakka Noodles', 'Classic wok noodles tossed with tender chicken pieces and greens', 14000, 15, 'Non-Veg Noodles'),
    ('Chicken Schezwan Noodles', 'Fiery wok noodles with chicken in bold schezwan seasoning', 15000, 15, 'Non-Veg Noodles'),

    -- NON-VEG STARTERS
    ('Chicken Lollipop (Dry, 6 pcs)', 'Crispy frenched chicken winglets tossed in oriental glaze (6 pcs)', 17000, 18, 'Non-Veg Starters'),

    -- EVENING SNACKS (After 3:30 PM)
    ('Samosa Chaat', 'Crushed samosa topped with chole, curd, and chutneys (Available after 3:30 PM)', 4000, 5, 'Evening Snacks (After 3:30 PM)'),
    ('Bhaji', 'Crisp piping hot onion pakoras / bhajji (Available after 3:30 PM)', 4000, 8, 'Evening Snacks (After 3:30 PM)'),
    ('Papdi Chaat', 'Crisp papdis layered with potatoes, chickpeas, curd and sweet tamarind (Available after 3:30 PM)', 4000, 5, 'Evening Snacks (After 3:30 PM)')
) AS v(name, description, price_paise, prep_minutes, category)
WHERE NOT EXISTS (
  SELECT 1 FROM public.menu_items m 
  WHERE m.cafe_id = c.id AND m.name = v.name
);

-- Step 5: Verify remaining canteens and confirm item counts
SELECT 
  c.id AS cafe_id, 
  c.name AS cafe_name, 
  count(m.id) AS total_menu_items
FROM public.cafes c
LEFT JOIN public.menu_items m ON m.cafe_id = c.id
GROUP BY c.id, c.name;
