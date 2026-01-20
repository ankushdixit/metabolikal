-- Seed data for testing the Nutrition Module
-- Run this in Supabase SQL Editor or via CLI

-- First, insert food items with proper UUIDs
INSERT INTO food_items (id, name, calories, protein, carbs, fats, serving_size, is_vegetarian, meal_types) VALUES
  -- Proteins
  ('00000000-0000-0000-0000-000000000001', 'Grilled Chicken Breast', 165, 31, 0, 4, '100g', false, ARRAY['pre-workout', 'post-workout', 'lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000002', 'Salmon Fillet', 208, 20, 0, 13, '100g', false, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000003', 'Scrambled Eggs', 147, 10, 1, 11, '2 eggs', false, ARRAY['breakfast', 'post-workout']),
  ('00000000-0000-0000-0000-000000000004', 'Greek Yogurt', 100, 17, 6, 1, '170g', true, ARRAY['breakfast', 'evening-snack']),
  ('00000000-0000-0000-0000-000000000005', 'Cottage Cheese', 98, 11, 3, 4, '100g', true, ARRAY['breakfast', 'evening-snack']),
  ('00000000-0000-0000-0000-000000000006', 'Tofu Steak', 144, 15, 4, 8, '150g', true, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000007', 'Paneer Tikka', 265, 18, 4, 20, '100g', true, ARRAY['lunch', 'dinner']),

  -- Carbs
  ('00000000-0000-0000-0000-000000000008', 'Brown Rice', 216, 5, 45, 2, '1 cup cooked', true, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000009', 'Oatmeal', 150, 5, 27, 3, '1 cup cooked', true, ARRAY['breakfast', 'pre-workout']),
  ('00000000-0000-0000-0000-000000000010', 'Sweet Potato', 103, 2, 24, 0, '100g', true, ARRAY['lunch', 'dinner', 'pre-workout']),
  ('00000000-0000-0000-0000-000000000011', 'Whole Wheat Toast', 69, 4, 12, 1, '1 slice', true, ARRAY['breakfast']),
  ('00000000-0000-0000-0000-000000000012', 'Quinoa', 222, 8, 39, 4, '1 cup cooked', true, ARRAY['lunch', 'dinner']),

  -- Snacks
  ('00000000-0000-0000-0000-000000000013', 'Banana', 105, 1, 27, 0, '1 medium', true, ARRAY['pre-workout', 'evening-snack']),
  ('00000000-0000-0000-0000-000000000014', 'Apple with Peanut Butter', 267, 7, 34, 14, '1 apple + 2 tbsp', true, ARRAY['evening-snack']),
  ('00000000-0000-0000-0000-000000000015', 'Mixed Nuts', 173, 5, 6, 16, '30g', true, ARRAY['evening-snack']),
  ('00000000-0000-0000-0000-000000000016', 'Protein Shake', 120, 24, 3, 1, '1 scoop + water', true, ARRAY['post-workout']),
  ('00000000-0000-0000-0000-000000000017', 'Hard Boiled Eggs', 78, 6, 1, 5, '1 egg', false, ARRAY['evening-snack', 'breakfast']),

  -- Full meals
  ('00000000-0000-0000-0000-000000000018', 'Chicken Salad', 350, 35, 15, 18, '1 bowl', false, ARRAY['lunch']),
  ('00000000-0000-0000-0000-000000000019', 'Vegetable Stir Fry with Tofu', 280, 18, 25, 14, '1 plate', true, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000020', 'Grilled Fish with Vegetables', 320, 38, 12, 14, '1 plate', false, ARRAY['lunch', 'dinner'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fats = EXCLUDED.fats,
  serving_size = EXCLUDED.serving_size,
  is_vegetarian = EXCLUDED.is_vegetarian,
  meal_types = EXCLUDED.meal_types;

-- Create diet plans for the first user in the database
DO $$
DECLARE
    user_id UUID;
    day_num INT;
    dp_id UUID;
BEGIN
    -- Get the first user (or change this query to get a specific user)
    SELECT id INTO user_id FROM profiles LIMIT 1;

    IF user_id IS NULL THEN
        RAISE NOTICE 'No user found in profiles table. Please register first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Creating diet plans for user: %', user_id;

    -- Delete existing diet plans and alternatives for this user to avoid duplicates
    DELETE FROM food_alternatives WHERE diet_plan_id IN (SELECT id FROM diet_plans WHERE client_id = user_id);
    DELETE FROM diet_plans WHERE client_id = user_id;

    -- Create diet plans for days 1-7
    FOR day_num IN 1..7 LOOP
        -- Pre-workout meal (Banana)
        INSERT INTO diet_plans (id, client_id, day_number, meal_category, food_item_id, serving_multiplier, notes)
        VALUES (gen_random_uuid(), user_id, day_num, 'pre-workout', '00000000-0000-0000-0000-000000000013', 1.0, 'Eat 30-60 min before workout')
        RETURNING id INTO dp_id;

        -- Add alternatives for pre-workout
        INSERT INTO food_alternatives (diet_plan_id, food_item_id, is_optimal, display_order) VALUES
            (dp_id, '00000000-0000-0000-0000-000000000009', true, 1),  -- Oatmeal
            (dp_id, '00000000-0000-0000-0000-000000000010', false, 2), -- Sweet Potato
            (dp_id, '00000000-0000-0000-0000-000000000011', false, 3); -- Toast

        -- Post-workout meal (Protein Shake)
        INSERT INTO diet_plans (id, client_id, day_number, meal_category, food_item_id, serving_multiplier, notes)
        VALUES (gen_random_uuid(), user_id, day_num, 'post-workout', '00000000-0000-0000-0000-000000000016', 1.0, 'Within 30 min after workout')
        RETURNING id INTO dp_id;

        -- Add alternatives for post-workout
        INSERT INTO food_alternatives (diet_plan_id, food_item_id, is_optimal, display_order) VALUES
            (dp_id, '00000000-0000-0000-0000-000000000003', true, 1),  -- Scrambled Eggs
            (dp_id, '00000000-0000-0000-0000-000000000004', false, 2), -- Greek Yogurt
            (dp_id, '00000000-0000-0000-0000-000000000001', false, 3); -- Chicken

        -- Breakfast (Oatmeal)
        INSERT INTO diet_plans (id, client_id, day_number, meal_category, food_item_id, serving_multiplier, notes)
        VALUES (gen_random_uuid(), user_id, day_num, 'breakfast', '00000000-0000-0000-0000-000000000009', 1.0, 'Start your day right')
        RETURNING id INTO dp_id;

        -- Add alternatives for breakfast
        INSERT INTO food_alternatives (diet_plan_id, food_item_id, is_optimal, display_order) VALUES
            (dp_id, '00000000-0000-0000-0000-000000000003', true, 1),  -- Scrambled Eggs
            (dp_id, '00000000-0000-0000-0000-000000000004', false, 2), -- Greek Yogurt
            (dp_id, '00000000-0000-0000-0000-000000000005', false, 3), -- Cottage Cheese
            (dp_id, '00000000-0000-0000-0000-000000000011', false, 4); -- Toast

        -- Lunch (Chicken Salad)
        INSERT INTO diet_plans (id, client_id, day_number, meal_category, food_item_id, serving_multiplier, notes)
        VALUES (gen_random_uuid(), user_id, day_num, 'lunch', '00000000-0000-0000-0000-000000000018', 1.0, NULL)
        RETURNING id INTO dp_id;

        -- Add alternatives for lunch
        INSERT INTO food_alternatives (diet_plan_id, food_item_id, is_optimal, display_order) VALUES
            (dp_id, '00000000-0000-0000-0000-000000000001', true, 1),  -- Grilled Chicken
            (dp_id, '00000000-0000-0000-0000-000000000019', false, 2), -- Veg Stir Fry
            (dp_id, '00000000-0000-0000-0000-000000000006', false, 3), -- Tofu
            (dp_id, '00000000-0000-0000-0000-000000000007', false, 4), -- Paneer
            (dp_id, '00000000-0000-0000-0000-000000000020', false, 5); -- Fish

        -- Evening snack (Apple with Peanut Butter)
        INSERT INTO diet_plans (id, client_id, day_number, meal_category, food_item_id, serving_multiplier, notes)
        VALUES (gen_random_uuid(), user_id, day_num, 'evening-snack', '00000000-0000-0000-0000-000000000014', 1.0, NULL)
        RETURNING id INTO dp_id;

        -- Add alternatives for evening snack
        INSERT INTO food_alternatives (diet_plan_id, food_item_id, is_optimal, display_order) VALUES
            (dp_id, '00000000-0000-0000-0000-000000000015', true, 1),  -- Mixed Nuts
            (dp_id, '00000000-0000-0000-0000-000000000004', false, 2), -- Greek Yogurt
            (dp_id, '00000000-0000-0000-0000-000000000005', false, 3), -- Cottage Cheese
            (dp_id, '00000000-0000-0000-0000-000000000017', false, 4); -- Hard Boiled Eggs

        -- Dinner (Salmon)
        INSERT INTO diet_plans (id, client_id, day_number, meal_category, food_item_id, serving_multiplier, notes)
        VALUES (gen_random_uuid(), user_id, day_num, 'dinner', '00000000-0000-0000-0000-000000000002', 1.0, NULL)
        RETURNING id INTO dp_id;

        -- Add alternatives for dinner
        INSERT INTO food_alternatives (diet_plan_id, food_item_id, is_optimal, display_order) VALUES
            (dp_id, '00000000-0000-0000-0000-000000000001', true, 1),  -- Grilled Chicken
            (dp_id, '00000000-0000-0000-0000-000000000020', false, 2), -- Fish with Veg
            (dp_id, '00000000-0000-0000-0000-000000000006', false, 3), -- Tofu
            (dp_id, '00000000-0000-0000-0000-000000000007', false, 4), -- Paneer
            (dp_id, '00000000-0000-0000-0000-000000000019', false, 5); -- Veg Stir Fry

        RAISE NOTICE 'Created diet plan for day %', day_num;
    END LOOP;

    RAISE NOTICE 'Diet plans created successfully!';
END $$;

-- Verify the data was created
SELECT 'Food items count:' as info, COUNT(*) as count FROM food_items;
SELECT 'Diet plans count:' as info, COUNT(*) as count FROM diet_plans;
SELECT 'Food alternatives count:' as info, COUNT(*) as count FROM food_alternatives;
