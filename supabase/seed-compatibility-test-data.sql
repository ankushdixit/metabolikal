-- Seed data for testing Food-Condition Compatibility Warnings
-- Run this against your Supabase database to set up test data
--
-- Prerequisites:
-- - Jane Smith client must exist (id: 22222222-2222-2222-2222-222222222222)
-- - Medical conditions table must be populated
-- - Food items table must be populated

-- Step 1: Get or create the Hypothyroidism condition
-- (This should already exist from the initial schema)
DO $$
DECLARE
    v_hypothyroidism_id UUID;
    v_type2_diabetes_id UUID;
    v_jane_smith_id UUID := '22222222-2222-2222-2222-222222222222';
    v_oatmeal_id UUID;
    v_brown_rice_id UUID;
    v_banana_id UUID;
BEGIN
    -- Get condition IDs
    SELECT id INTO v_hypothyroidism_id FROM medical_conditions WHERE slug = 'hypothyroidism' LIMIT 1;
    SELECT id INTO v_type2_diabetes_id FROM medical_conditions WHERE slug = 'type2-diabetes' LIMIT 1;

    -- Get food item IDs (adjust names based on what exists in your database)
    SELECT id INTO v_oatmeal_id FROM food_items WHERE LOWER(name) LIKE '%oatmeal%' LIMIT 1;
    SELECT id INTO v_brown_rice_id FROM food_items WHERE LOWER(name) LIKE '%brown rice%' LIMIT 1;
    SELECT id INTO v_banana_id FROM food_items WHERE LOWER(name) LIKE '%banana%' LIMIT 1;

    -- Debug: Print what we found
    RAISE NOTICE 'Hypothyroidism ID: %', v_hypothyroidism_id;
    RAISE NOTICE 'Type 2 Diabetes ID: %', v_type2_diabetes_id;
    RAISE NOTICE 'Oatmeal ID: %', v_oatmeal_id;
    RAISE NOTICE 'Brown Rice ID: %', v_brown_rice_id;
    RAISE NOTICE 'Banana ID: %', v_banana_id;

    -- Step 2: Add conditions to Jane Smith (client_conditions)
    IF v_hypothyroidism_id IS NOT NULL THEN
        INSERT INTO client_conditions (client_id, condition_id, notes)
        VALUES (v_jane_smith_id, v_hypothyroidism_id, 'Test data for compatibility warning feature')
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'Added Hypothyroidism to Jane Smith';
    ELSE
        RAISE WARNING 'Hypothyroidism condition not found';
    END IF;

    -- Step 3: Link food items to conditions (food_item_conditions)
    -- These foods will trigger warnings when added to Jane Smith's plan

    IF v_oatmeal_id IS NOT NULL AND v_hypothyroidism_id IS NOT NULL THEN
        INSERT INTO food_item_conditions (food_item_id, condition_id)
        VALUES (v_oatmeal_id, v_hypothyroidism_id)
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'Linked Oatmeal to Hypothyroidism (incompatible)';
    END IF;

    IF v_brown_rice_id IS NOT NULL AND v_hypothyroidism_id IS NOT NULL THEN
        INSERT INTO food_item_conditions (food_item_id, condition_id)
        VALUES (v_brown_rice_id, v_hypothyroidism_id)
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'Linked Brown Rice to Hypothyroidism (incompatible)';
    END IF;

    -- Banana is incompatible with Type 2 Diabetes (example of multiple conditions)
    IF v_banana_id IS NOT NULL AND v_type2_diabetes_id IS NOT NULL THEN
        INSERT INTO food_item_conditions (food_item_id, condition_id)
        VALUES (v_banana_id, v_type2_diabetes_id)
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'Linked Banana to Type 2 Diabetes (incompatible)';
    END IF;

END $$;

-- Verification queries (run these to check the data was inserted)
-- SELECT * FROM client_conditions WHERE client_id = '22222222-2222-2222-2222-222222222222';
-- SELECT fic.*, fi.name as food_name, mc.name as condition_name
-- FROM food_item_conditions fic
-- JOIN food_items fi ON fic.food_item_id = fi.id
-- JOIN medical_conditions mc ON fic.condition_id = mc.id;
