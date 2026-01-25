-- Seed data for testing the Challengers Management Page
--
-- USAGE:
-- Run: psql $DATABASE_URL -f supabase/seed-challenger-data.sql
--
-- This script creates:
-- 1. Test challenger profiles (8 challengers)
-- 2. Challenge progress entries (various completion levels)
-- 3. Assessment results for some challengers
-- 4. Calculator results for some challengers
--
-- IMPORTANT:
-- - These are demo users for the admin panel display
-- - They don't have actual auth.users entries (for display only)

-- Define fixed UUIDs for test challengers
DO $$
DECLARE
    challenger1_id UUID := 'c1111111-1111-1111-1111-111111111111';
    challenger2_id UUID := 'c2222222-2222-2222-2222-222222222222';
    challenger3_id UUID := 'c3333333-3333-3333-3333-333333333333';
    challenger4_id UUID := 'c4444444-4444-4444-4444-444444444444';
    challenger5_id UUID := 'c5555555-5555-5555-5555-555555555555';
    challenger6_id UUID := 'c6666666-6666-6666-6666-666666666666';
    challenger7_id UUID := 'c7777777-7777-7777-7777-777777777777';
    challenger8_id UUID := 'c8888888-8888-8888-8888-888888888888';
    day_num INT;
    random_points INT;
BEGIN

    RAISE NOTICE 'Starting challenger test data seed...';

    -- Clean up existing test data
    DELETE FROM challenge_progress WHERE user_id IN (
        challenger1_id, challenger2_id, challenger3_id, challenger4_id,
        challenger5_id, challenger6_id, challenger7_id, challenger8_id
    );
    DELETE FROM assessment_results WHERE user_id IN (
        challenger1_id, challenger2_id, challenger3_id, challenger4_id,
        challenger5_id, challenger6_id, challenger7_id, challenger8_id
    );
    DELETE FROM calculator_results WHERE user_id IN (
        challenger1_id, challenger2_id, challenger3_id, challenger4_id,
        challenger5_id, challenger6_id, challenger7_id, challenger8_id
    );
    DELETE FROM profiles WHERE id IN (
        challenger1_id, challenger2_id, challenger3_id, challenger4_id,
        challenger5_id, challenger6_id, challenger7_id, challenger8_id
    );

    RAISE NOTICE 'Cleaned up existing challenger test data';

    -- =============================================
    -- CREATE TEST CHALLENGER PROFILES
    -- =============================================

    -- Challenger 1: Highly active, almost done with challenge (25 days)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger1_id, 'marcus.johnson@email.com', 'Marcus Johnson', '+1555100001', 'challenger', NOW() - INTERVAL '26 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    -- Challenger 2: Moderate progress (15 days)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger2_id, 'emily.rodriguez@email.com', 'Emily Rodriguez', '+1555100002', 'challenger', NOW() - INTERVAL '18 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    -- Challenger 3: Just started (5 days)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger3_id, 'david.kim@email.com', 'David Kim', '+1555100003', 'challenger', NOW() - INTERVAL '6 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    -- Challenger 4: Completed the full 30 days!
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger4_id, 'sophia.patel@email.com', 'Sophia Patel', '+1555100004', 'challenger', NOW() - INTERVAL '35 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    -- Challenger 5: Dropped off after 8 days (inactive)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger5_id, 'james.wilson@email.com', 'James Wilson', '+1555100005', 'challenger', NOW() - INTERVAL '20 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    -- Challenger 6: Very new, just joined (2 days)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger6_id, 'olivia.martinez@email.com', 'Olivia Martinez', '+1555100006', 'challenger', NOW() - INTERVAL '2 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    -- Challenger 7: Good progress (20 days)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger7_id, 'ryan.thompson@email.com', 'Ryan Thompson', '+1555100007', 'challenger', NOW() - INTERVAL '22 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    -- Challenger 8: Steady progress (12 days)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger8_id, 'ava.nguyen@email.com', 'Ava Nguyen', '+1555100008', 'challenger', NOW() - INTERVAL '14 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    RAISE NOTICE 'Created 8 test challenger profiles';

    -- =============================================
    -- CREATE CHALLENGE PROGRESS ENTRIES
    -- =============================================

    -- Challenger 1: Marcus Johnson - 25 days of progress
    FOR day_num IN 1..25 LOOP
        random_points := 80 + floor(random() * 40)::int; -- 80-120 points per day
        INSERT INTO challenge_progress (
            visitor_id, user_id, day_number, logged_date,
            steps, water_liters, floors_climbed, protein_grams, sleep_hours,
            feeling, tomorrow_focus, points_earned
        ) VALUES (
            'visitor_marcus_' || day_num,
            challenger1_id,
            day_num,
            (NOW() - INTERVAL '26 days' + (day_num || ' days')::interval)::date,
            8000 + floor(random() * 4000)::int,
            2.0 + (random() * 1.5)::numeric(3,1),
            floor(random() * 15)::int,
            120 + floor(random() * 60)::int,
            6.5 + (random() * 2)::numeric(3,1),
            CASE floor(random() * 4)::int
                WHEN 0 THEN 'energized'
                WHEN 1 THEN 'strong'
                WHEN 2 THEN 'focused'
                ELSE 'motivated'
            END,
            CASE floor(random() * 3)::int
                WHEN 0 THEN 'Hit protein goal'
                WHEN 1 THEN 'More water'
                ELSE 'Better sleep'
            END,
            random_points
        );
    END LOOP;

    -- Challenger 2: Emily Rodriguez - 15 days of progress
    FOR day_num IN 1..15 LOOP
        random_points := 70 + floor(random() * 35)::int;
        INSERT INTO challenge_progress (
            visitor_id, user_id, day_number, logged_date,
            steps, water_liters, floors_climbed, protein_grams, sleep_hours,
            feeling, tomorrow_focus, points_earned
        ) VALUES (
            'visitor_emily_' || day_num,
            challenger2_id,
            day_num,
            (NOW() - INTERVAL '18 days' + (day_num || ' days')::interval)::date,
            6000 + floor(random() * 3000)::int,
            1.5 + (random() * 1.5)::numeric(3,1),
            floor(random() * 10)::int,
            100 + floor(random() * 50)::int,
            7.0 + (random() * 1.5)::numeric(3,1),
            CASE floor(random() * 3)::int
                WHEN 0 THEN 'good'
                WHEN 1 THEN 'tired'
                ELSE 'improving'
            END,
            'Stay consistent',
            random_points
        );
    END LOOP;

    -- Challenger 3: David Kim - 5 days of progress
    FOR day_num IN 1..5 LOOP
        random_points := 60 + floor(random() * 30)::int;
        INSERT INTO challenge_progress (
            visitor_id, user_id, day_number, logged_date,
            steps, water_liters, floors_climbed, protein_grams, sleep_hours,
            feeling, tomorrow_focus, points_earned
        ) VALUES (
            'visitor_david_' || day_num,
            challenger3_id,
            day_num,
            (NOW() - INTERVAL '6 days' + (day_num || ' days')::interval)::date,
            5000 + floor(random() * 2000)::int,
            1.5 + (random() * 1)::numeric(3,1),
            floor(random() * 5)::int,
            80 + floor(random() * 40)::int,
            6.0 + (random() * 2)::numeric(3,1),
            'learning',
            'Build the habit',
            random_points
        );
    END LOOP;

    -- Challenger 4: Sophia Patel - Full 30 days!
    FOR day_num IN 1..30 LOOP
        random_points := 90 + floor(random() * 30)::int;
        INSERT INTO challenge_progress (
            visitor_id, user_id, day_number, logged_date,
            steps, water_liters, floors_climbed, protein_grams, sleep_hours,
            feeling, tomorrow_focus, points_earned
        ) VALUES (
            'visitor_sophia_' || day_num,
            challenger4_id,
            day_num,
            (NOW() - INTERVAL '35 days' + (day_num || ' days')::interval)::date,
            10000 + floor(random() * 5000)::int,
            2.5 + (random() * 1)::numeric(3,1),
            5 + floor(random() * 15)::int,
            140 + floor(random() * 40)::int,
            7.0 + (random() * 1.5)::numeric(3,1),
            CASE floor(random() * 3)::int
                WHEN 0 THEN 'amazing'
                WHEN 1 THEN 'unstoppable'
                ELSE 'proud'
            END,
            'Keep the momentum',
            random_points
        );
    END LOOP;

    -- Challenger 5: James Wilson - 8 days then dropped off
    FOR day_num IN 1..8 LOOP
        random_points := 50 + floor(random() * 25)::int;
        INSERT INTO challenge_progress (
            visitor_id, user_id, day_number, logged_date,
            steps, water_liters, floors_climbed, protein_grams, sleep_hours,
            feeling, tomorrow_focus, points_earned
        ) VALUES (
            'visitor_james_' || day_num,
            challenger5_id,
            day_num,
            (NOW() - INTERVAL '20 days' + (day_num || ' days')::interval)::date,
            4000 + floor(random() * 2000)::int,
            1.0 + (random() * 1)::numeric(3,1),
            floor(random() * 5)::int,
            60 + floor(random() * 40)::int,
            5.5 + (random() * 2)::numeric(3,1),
            'struggling',
            'Try harder tomorrow',
            random_points
        );
    END LOOP;

    -- Challenger 6: Olivia Martinez - 2 days (brand new)
    FOR day_num IN 1..2 LOOP
        random_points := 65 + floor(random() * 25)::int;
        INSERT INTO challenge_progress (
            visitor_id, user_id, day_number, logged_date,
            steps, water_liters, floors_climbed, protein_grams, sleep_hours,
            feeling, tomorrow_focus, points_earned
        ) VALUES (
            'visitor_olivia_' || day_num,
            challenger6_id,
            day_num,
            (NOW() - INTERVAL '2 days' + (day_num || ' days')::interval)::date,
            6000 + floor(random() * 2000)::int,
            2.0 + (random() * 0.5)::numeric(3,1),
            floor(random() * 8)::int,
            90 + floor(random() * 30)::int,
            7.0 + (random() * 1)::numeric(3,1),
            'excited',
            'Keep going!',
            random_points
        );
    END LOOP;

    -- Challenger 7: Ryan Thompson - 20 days
    FOR day_num IN 1..20 LOOP
        random_points := 75 + floor(random() * 35)::int;
        INSERT INTO challenge_progress (
            visitor_id, user_id, day_number, logged_date,
            steps, water_liters, floors_climbed, protein_grams, sleep_hours,
            feeling, tomorrow_focus, points_earned
        ) VALUES (
            'visitor_ryan_' || day_num,
            challenger7_id,
            day_num,
            (NOW() - INTERVAL '22 days' + (day_num || ' days')::interval)::date,
            7500 + floor(random() * 3500)::int,
            2.0 + (random() * 1)::numeric(3,1),
            floor(random() * 12)::int,
            110 + floor(random() * 50)::int,
            6.5 + (random() * 1.5)::numeric(3,1),
            CASE floor(random() * 3)::int
                WHEN 0 THEN 'strong'
                WHEN 1 THEN 'determined'
                ELSE 'focused'
            END,
            'Push harder',
            random_points
        );
    END LOOP;

    -- Challenger 8: Ava Nguyen - 12 days
    FOR day_num IN 1..12 LOOP
        random_points := 70 + floor(random() * 30)::int;
        INSERT INTO challenge_progress (
            visitor_id, user_id, day_number, logged_date,
            steps, water_liters, floors_climbed, protein_grams, sleep_hours,
            feeling, tomorrow_focus, points_earned
        ) VALUES (
            'visitor_ava_' || day_num,
            challenger8_id,
            day_num,
            (NOW() - INTERVAL '14 days' + (day_num || ' days')::interval)::date,
            6500 + floor(random() * 2500)::int,
            1.8 + (random() * 1)::numeric(3,1),
            floor(random() * 10)::int,
            95 + floor(random() * 45)::int,
            7.0 + (random() * 1)::numeric(3,1),
            CASE floor(random() * 2)::int
                WHEN 0 THEN 'steady'
                ELSE 'improving'
            END,
            'Stay on track',
            random_points
        );
    END LOOP;

    RAISE NOTICE 'Created challenge progress entries';

    -- =============================================
    -- CREATE ASSESSMENT RESULTS (for some challengers)
    -- =============================================

    -- Marcus (top performer) - has assessment (scores 0-10)
    INSERT INTO assessment_results (
        visitor_id, user_id, assessed_at,
        sleep_score, body_score, nutrition_score, mental_score, stress_score, support_score, hydration_score,
        gender, age, weight_kg, height_cm, body_fat_percent, activity_level,
        goal, bmr, tdee, target_calories, health_score, lifestyle_score
    ) VALUES (
        'visitor_marcus_assessment',
        challenger1_id,
        NOW() - INTERVAL '26 days',
        8, 7, 6, 8, 6, 9, 7,
        'male', 32, 82.5, 178, 18.5, 'moderate',
        'fat_loss', 1820, 2548, 2048, 72, 68
    );

    -- Sophia (completed 30 days) - has assessment (scores 0-10)
    INSERT INTO assessment_results (
        visitor_id, user_id, assessed_at,
        sleep_score, body_score, nutrition_score, mental_score, stress_score, support_score, hydration_score,
        gender, age, weight_kg, height_cm, body_fat_percent, activity_level,
        goal, bmr, tdee, target_calories, health_score, lifestyle_score
    ) VALUES (
        'visitor_sophia_assessment',
        challenger4_id,
        NOW() - INTERVAL '35 days',
        9, 8, 7, 9, 7, 9, 8,
        'female', 28, 62.0, 165, 22.0, 'active',
        'maintain', 1410, 2186, 2186, 81, 78
    );

    -- Ryan (good progress) - has assessment (scores 0-10)
    INSERT INTO assessment_results (
        visitor_id, user_id, assessed_at,
        sleep_score, body_score, nutrition_score, mental_score, stress_score, support_score, hydration_score,
        gender, age, weight_kg, height_cm, body_fat_percent, activity_level,
        goal, bmr, tdee, target_calories, health_score, lifestyle_score
    ) VALUES (
        'visitor_ryan_assessment',
        challenger7_id,
        NOW() - INTERVAL '22 days',
        7, 6, 6, 7, 5, 8, 6,
        'male', 35, 88.0, 182, 22.0, 'light',
        'fat_loss', 1875, 2531, 2031, 67, 63
    );

    -- Emily (moderate progress) - has assessment (scores 0-10)
    INSERT INTO assessment_results (
        visitor_id, user_id, assessed_at,
        sleep_score, body_score, nutrition_score, mental_score, stress_score, support_score, hydration_score,
        gender, age, weight_kg, height_cm, body_fat_percent, activity_level,
        goal, bmr, tdee, target_calories, health_score, lifestyle_score
    ) VALUES (
        'visitor_emily_assessment',
        challenger2_id,
        NOW() - INTERVAL '18 days',
        6, 6, 5, 7, 5, 7, 6,
        'female', 30, 68.0, 162, 26.0, 'sedentary',
        'fat_loss', 1420, 1704, 1404, 62, 58
    );

    RAISE NOTICE 'Created assessment results for 4 challengers';

    -- =============================================
    -- CREATE CALCULATOR RESULTS (for some challengers)
    -- =============================================

    -- Marcus - has calculator results
    INSERT INTO calculator_results (
        user_id, gender, age, weight_kg, height_cm, body_fat_percent,
        activity_level, goal, bmr, tdee, target_calories,
        protein_grams, carbs_grams, fats_grams
    ) VALUES (
        challenger1_id, 'male', 32, 82.5, 178, 18.5,
        'moderate', 'fat_loss', 1820, 2548, 2048,
        165, 205, 68
    );

    -- Sophia - has calculator results
    INSERT INTO calculator_results (
        user_id, gender, age, weight_kg, height_cm, body_fat_percent,
        activity_level, goal, bmr, tdee, target_calories,
        protein_grams, carbs_grams, fats_grams
    ) VALUES (
        challenger4_id, 'female', 28, 62.0, 165, 22.0,
        'active', 'maintain', 1410, 2186, 2186,
        124, 274, 73
    );

    -- Ryan - has calculator results
    INSERT INTO calculator_results (
        user_id, gender, age, weight_kg, height_cm, body_fat_percent,
        activity_level, goal, bmr, tdee, target_calories,
        protein_grams, carbs_grams, fats_grams
    ) VALUES (
        challenger7_id, 'male', 35, 88.0, 182, 22.0,
        'light', 'fat_loss', 1875, 2531, 2031,
        176, 203, 68
    );

    RAISE NOTICE 'Created calculator results for 3 challengers';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Challenger test data seed completed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - 8 challenger profiles';
    RAISE NOTICE '  - Challenge progress entries (117 total days)';
    RAISE NOTICE '  - 4 assessment results';
    RAISE NOTICE '  - 3 calculator results';
    RAISE NOTICE '';
    RAISE NOTICE 'Test scenarios:';
    RAISE NOTICE '  - Marcus Johnson: 25/30 days, assessment+calculator';
    RAISE NOTICE '  - Emily Rodriguez: 15/30 days, assessment only';
    RAISE NOTICE '  - David Kim: 5/30 days, no profile data';
    RAISE NOTICE '  - Sophia Patel: 30/30 days COMPLETE!, assessment+calculator';
    RAISE NOTICE '  - James Wilson: 8/30 days, dropped off (inactive)';
    RAISE NOTICE '  - Olivia Martinez: 2/30 days, brand new';
    RAISE NOTICE '  - Ryan Thompson: 20/30 days, assessment+calculator';
    RAISE NOTICE '  - Ava Nguyen: 12/30 days, no profile data';
END $$;

-- Verify the data was created
SELECT '========== VERIFICATION ==========' as info;
SELECT 'Test Challengers:' as info, COUNT(*) as count FROM profiles WHERE role = 'challenger';
SELECT 'Challenge Progress (Total Days):' as info, COUNT(*) as count FROM challenge_progress;
SELECT 'Assessment Results:' as info, COUNT(*) as count FROM assessment_results WHERE user_id IN (
    'c1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333',
    'c4444444-4444-4444-4444-444444444444',
    'c5555555-5555-5555-5555-555555555555',
    'c6666666-6666-6666-6666-666666666666',
    'c7777777-7777-7777-7777-777777777777',
    'c8888888-8888-8888-8888-888888888888'
);
SELECT 'Calculator Results:' as info, COUNT(*) as count FROM calculator_results WHERE user_id IN (
    'c1111111-1111-1111-1111-111111111111',
    'c4444444-4444-4444-4444-444444444444',
    'c7777777-7777-7777-7777-777777777777'
);
