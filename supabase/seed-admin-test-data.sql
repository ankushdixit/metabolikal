-- Seed data for testing the Admin Dashboard
--
-- USAGE:
-- 1. First run: ./supabase/seed-test-users.sh (creates auth users via Admin API)
-- 2. Then run:  psql $DATABASE_URL -f supabase/seed-admin-test-data.sql
--
-- This script creates:
-- 1. Test client profiles (5 clients)
-- 2. Check-ins with various states (reviewed, pending, flagged)
-- 3. Diet plans for each client
-- 4. Workout plans for each client
--
-- IMPORTANT:
-- - Run seed-test-users.sh first to create auth users
-- - Make sure food_items exist (run seed-nutrition-data.sql)

-- Define fixed UUIDs for test users
DO $$
DECLARE
    -- Use the existing admin user ID for reviewed_by references
    admin_id UUID := '4e94db70-00dd-4bf6-a1e1-736c4f7747f2';
    client1_id UUID := '11111111-1111-1111-1111-111111111111';
    client2_id UUID := '22222222-2222-2222-2222-222222222222';
    client3_id UUID := '33333333-3333-3333-3333-333333333333';
    client4_id UUID := '44444444-4444-4444-4444-444444444444';
    client5_id UUID := '55555555-5555-5555-5555-555555555555';
    day_num INT;
BEGIN

    RAISE NOTICE 'Starting admin test data seed...';
    RAISE NOTICE 'Using admin ID: % (cooldixitankush@gmail.com)', admin_id;

    -- Clean up existing test data (NOT auth.users - those are managed separately)
    DELETE FROM food_alternatives WHERE diet_plan_id IN (
        SELECT id FROM diet_plans WHERE client_id IN (client1_id, client2_id, client3_id, client4_id, client5_id)
    );
    DELETE FROM workout_logs WHERE client_id IN (client1_id, client2_id, client3_id, client4_id, client5_id);
    DELETE FROM food_logs WHERE client_id IN (client1_id, client2_id, client3_id, client4_id, client5_id);
    DELETE FROM check_ins WHERE client_id IN (client1_id, client2_id, client3_id, client4_id, client5_id);
    DELETE FROM diet_plans WHERE client_id IN (client1_id, client2_id, client3_id, client4_id, client5_id);
    DELETE FROM workout_plans WHERE client_id IN (client1_id, client2_id, client3_id, client4_id, client5_id);
    DELETE FROM profiles WHERE id IN (client1_id, client2_id, client3_id, client4_id, client5_id);

    RAISE NOTICE 'Cleaned up existing test data';

    -- =============================================
    -- CREATE TEST CLIENT PROFILES
    -- =============================================
    -- Note: auth.users must be created first via seed-test-users.sh

    -- Client 1: Active client with good progress (started 45 days ago)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (client1_id, 'john.doe@test.com', 'John Doe', '+1234567890', 'client', NOW() - INTERVAL '45 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    -- Client 2: Flagged client needing attention (started 30 days ago)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (client2_id, 'jane.smith@test.com', 'Jane Smith', '+1234567891', 'client', NOW() - INTERVAL '30 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    -- Client 3: New client with pending review (started 14 days ago)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (client3_id, 'mike.wilson@test.com', 'Mike Wilson', '+1234567892', 'client', NOW() - INTERVAL '14 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    -- Client 4: Client with multiple check-ins (started 60 days ago)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (client4_id, 'sarah.johnson@test.com', 'Sarah Johnson', '+1234567893', 'client', NOW() - INTERVAL '60 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    -- Client 5: Recently started client (started 7 days ago)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (client5_id, 'alex.chen@test.com', 'Alex Chen', '+1234567894', 'client', NOW() - INTERVAL '7 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    RAISE NOTICE 'Created 5 test client profiles';

    -- =============================================
    -- CREATE CHECK-INS
    -- =============================================

    -- John Doe (client1): 6 check-ins, all reviewed, good progress
    INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percent, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm,
        photo_front, photo_side, photo_back,
        energy_rating, sleep_rating, stress_rating, mood_rating, diet_adherence, workout_adherence,
        challenges, progress_notes, questions, admin_notes, flagged_for_followup, reviewed_at, reviewed_by)
    VALUES
        (client1_id, NOW() - INTERVAL '42 days', 92.0, 24.0, 105, 95, 102, 36, 60,
            'https://placehold.co/400x600/1a1a1a/white?text=Front+W1', 'https://placehold.co/400x600/1a1a1a/white?text=Side+W1', NULL,
            6, 7, 5, 6, 70, 65,
            'Just starting, feeling motivated', 'First week complete!', NULL,
            'Good start, needs to improve diet adherence', false, NOW() - INTERVAL '41 days', admin_id),
        (client1_id, NOW() - INTERVAL '35 days', 90.5, 23.5, 104, 93, 101, 36, 59,
            'https://placehold.co/400x600/1a1a1a/white?text=Front+W2', 'https://placehold.co/400x600/1a1a1a/white?text=Side+W2', 'https://placehold.co/400x600/1a1a1a/white?text=Back+W2',
            7, 7, 4, 7, 80, 75,
            'Getting into the routine', 'Lost 1.5kg this week', NULL,
            'Great progress, keep it up!', false, NOW() - INTERVAL '34 days', admin_id),
        (client1_id, NOW() - INTERVAL '28 days', 89.0, 22.8, 103, 91, 100, 36.5, 58,
            'https://placehold.co/400x600/1a1a1a/white?text=Front+W3', 'https://placehold.co/400x600/1a1a1a/white?text=Side+W3', 'https://placehold.co/400x600/1a1a1a/white?text=Back+W3',
            8, 8, 3, 8, 85, 85,
            NULL, 'Feeling stronger, clothes fitting better', 'Should I increase protein?',
            'Excellent progress! Yes, increase protein by 20g', false, NOW() - INTERVAL '27 days', admin_id),
        (client1_id, NOW() - INTERVAL '21 days', 87.5, 22.0, 102, 89, 99, 37, 57,
            'https://placehold.co/400x600/1a1a1a/white?text=Front+W4', 'https://placehold.co/400x600/1a1a1a/white?text=Side+W4', 'https://placehold.co/400x600/1a1a1a/white?text=Back+W4',
            8, 7, 4, 8, 90, 90,
            'Work stress this week', 'Still making progress despite stress', NULL,
            'Handling stress well, maintaining routine', false, NOW() - INTERVAL '20 days', admin_id),
        (client1_id, NOW() - INTERVAL '14 days', 86.0, 21.5, 101, 87, 98, 37.5, 56,
            'https://placehold.co/400x600/1a1a1a/white?text=Front+W5', 'https://placehold.co/400x600/1a1a1a/white?text=Side+W5', 'https://placehold.co/400x600/1a1a1a/white?text=Back+W5',
            9, 8, 3, 9, 95, 95,
            NULL, 'Best week yet! Down 6kg total', 'Ready for more challenging workouts',
            'Outstanding! Moving to Phase 2 workouts', false, NOW() - INTERVAL '13 days', admin_id),
        (client1_id, NOW() - INTERVAL '7 days', 85.0, 21.0, 100, 85, 97, 38, 55,
            'https://placehold.co/400x600/1a1a1a/white?text=Front+W6', 'https://placehold.co/400x600/1a1a1a/white?text=Side+W6', 'https://placehold.co/400x600/1a1a1a/white?text=Back+W6',
            9, 9, 2, 9, 95, 100,
            NULL, 'Visible abs starting to show!', NULL,
            'Incredible transformation! Continue with current plan', false, NOW() - INTERVAL '6 days', admin_id);

    -- Jane Smith (client2): 4 check-ins, latest is FLAGGED and unreviewed
    INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percent, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm,
        photo_front, photo_side, photo_back,
        energy_rating, sleep_rating, stress_rating, mood_rating, diet_adherence, workout_adherence,
        challenges, progress_notes, questions, admin_notes, flagged_for_followup, reviewed_at, reviewed_by)
    VALUES
        (client2_id, NOW() - INTERVAL '28 days', 72.0, 28.0, 92, 78, 98, 30, 55,
            'https://placehold.co/400x600/1a1a1a/white?text=Jane+W1', NULL, NULL,
            7, 6, 5, 6, 75, 70,
            'Starting strong', 'Excited to begin', NULL,
            'Good first check-in', false, NOW() - INTERVAL '27 days', admin_id),
        (client2_id, NOW() - INTERVAL '21 days', 71.5, 27.5, 91, 77, 97, 30, 54,
            'https://placehold.co/400x600/1a1a1a/white?text=Jane+W2', 'https://placehold.co/400x600/1a1a1a/white?text=Jane+Side+W2', NULL,
            6, 5, 6, 5, 65, 60,
            'Work schedule making it hard', 'Struggling a bit', 'Can we adjust meal timing?',
            'Adjusted meal plan for work schedule', false, NOW() - INTERVAL '20 days', admin_id),
        (client2_id, NOW() - INTERVAL '14 days', 72.5, 28.2, 92, 79, 98, 30, 55,
            'https://placehold.co/400x600/1a1a1a/white?text=Jane+W3', NULL, NULL,
            4, 4, 8, 4, 50, 40,
            'Gained weight back, feeling discouraged', 'Had a bad week', 'Should I start over?',
            'Scheduled call to discuss mindset', true, NOW() - INTERVAL '13 days', admin_id),
        (client2_id, NOW() - INTERVAL '2 days', 73.0, 28.5, 93, 80, 99, 30, 56,
            'https://placehold.co/400x600/1a1a1a/white?text=Jane+W4', 'https://placehold.co/400x600/1a1a1a/white?text=Jane+Side+W4', NULL,
            3, 3, 9, 3, 40, 30,
            'Really struggling, life stress overwhelming', 'Need help getting back on track', 'Can we talk?',
            NULL, true, NULL, NULL); -- UNREVIEWED AND FLAGGED

    -- Mike Wilson (client3): 2 check-ins, latest PENDING review
    INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percent, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm,
        photo_front, photo_side, photo_back,
        energy_rating, sleep_rating, stress_rating, mood_rating, diet_adherence, workout_adherence,
        challenges, progress_notes, questions, admin_notes, flagged_for_followup, reviewed_at, reviewed_by)
    VALUES
        (client3_id, NOW() - INTERVAL '7 days', 85.0, 22.0, 100, 88, 95, 35, 58,
            'https://placehold.co/400x600/1a1a1a/white?text=Mike+W1', 'https://placehold.co/400x600/1a1a1a/white?text=Mike+Side+W1', 'https://placehold.co/400x600/1a1a1a/white?text=Mike+Back+W1',
            7, 7, 4, 7, 80, 85,
            'Learning the ropes', 'First week done!', 'Is this the right protein amount?',
            'Good start, protein is correct for your goals', false, NOW() - INTERVAL '6 days', admin_id),
        (client3_id, NOW() - INTERVAL '1 day', 84.2, 21.5, 99, 87, 94, 35.5, 57,
            'https://placehold.co/400x600/1a1a1a/white?text=Mike+W2', 'https://placehold.co/400x600/1a1a1a/white?text=Mike+Side+W2', 'https://placehold.co/400x600/1a1a1a/white?text=Mike+Back+W2',
            8, 8, 3, 8, 85, 90,
            NULL, 'Feeling great, energy up', 'When should I increase workout intensity?',
            NULL, false, NULL, NULL); -- PENDING REVIEW

    -- Sarah Johnson (client4): 8 check-ins, all reviewed, long-term client
    INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percent, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm,
        photo_front, photo_side, photo_back,
        energy_rating, sleep_rating, stress_rating, mood_rating, diet_adherence, workout_adherence,
        challenges, progress_notes, questions, admin_notes, flagged_for_followup, reviewed_at, reviewed_by)
    VALUES
        (client4_id, NOW() - INTERVAL '56 days', 78.0, 30.0, 95, 82, 100, 32, 58, NULL, NULL, NULL,
            6, 6, 5, 6, 70, 70, 'Starting fresh', 'Week 1', NULL, 'Welcome!', false, NOW() - INTERVAL '55 days', admin_id),
        (client4_id, NOW() - INTERVAL '49 days', 77.0, 29.0, 94, 81, 99, 32, 57,
            'https://placehold.co/400x600/1a1a1a/white?text=Sarah+W2', NULL, NULL,
            7, 7, 4, 7, 75, 80, NULL, 'Good week', NULL, 'On track', false, NOW() - INTERVAL '48 days', admin_id),
        (client4_id, NOW() - INTERVAL '42 days', 75.5, 28.0, 93, 79, 98, 32, 56,
            'https://placehold.co/400x600/1a1a1a/white?text=Sarah+W3', 'https://placehold.co/400x600/1a1a1a/white?text=Sarah+Side+W3', NULL,
            8, 7, 4, 8, 80, 85, NULL, 'Feeling stronger', NULL, 'Great progress', false, NOW() - INTERVAL '41 days', admin_id),
        (client4_id, NOW() - INTERVAL '35 days', 74.0, 27.0, 92, 77, 97, 32.5, 55,
            'https://placehold.co/400x600/1a1a1a/white?text=Sarah+W4', 'https://placehold.co/400x600/1a1a1a/white?text=Sarah+Side+W4', 'https://placehold.co/400x600/1a1a1a/white?text=Sarah+Back+W4',
            8, 8, 3, 8, 85, 90, NULL, 'Best week!', NULL, 'Excellent!', false, NOW() - INTERVAL '34 days', admin_id),
        (client4_id, NOW() - INTERVAL '28 days', 73.0, 26.0, 91, 75, 96, 33, 54,
            'https://placehold.co/400x600/1a1a1a/white?text=Sarah+W5', 'https://placehold.co/400x600/1a1a1a/white?text=Sarah+Side+W5', 'https://placehold.co/400x600/1a1a1a/white?text=Sarah+Back+W5',
            8, 8, 3, 9, 90, 90, NULL, '5kg down!', NULL, 'Amazing consistency', false, NOW() - INTERVAL '27 days', admin_id),
        (client4_id, NOW() - INTERVAL '21 days', 72.0, 25.0, 90, 73, 95, 33, 53,
            'https://placehold.co/400x600/1a1a1a/white?text=Sarah+W6', 'https://placehold.co/400x600/1a1a1a/white?text=Sarah+Side+W6', 'https://placehold.co/400x600/1a1a1a/white?text=Sarah+Back+W6',
            9, 8, 2, 9, 95, 95, NULL, 'Loving the results', NULL, 'Keep it up!', false, NOW() - INTERVAL '20 days', admin_id),
        (client4_id, NOW() - INTERVAL '14 days', 71.0, 24.0, 89, 72, 94, 33.5, 52,
            'https://placehold.co/400x600/1a1a1a/white?text=Sarah+W7', 'https://placehold.co/400x600/1a1a1a/white?text=Sarah+Side+W7', 'https://placehold.co/400x600/1a1a1a/white?text=Sarah+Back+W7',
            9, 9, 2, 9, 95, 100, NULL, '7kg total loss!', NULL, 'Star client!', false, NOW() - INTERVAL '13 days', admin_id),
        (client4_id, NOW() - INTERVAL '7 days', 70.0, 23.5, 88, 71, 93, 34, 51,
            'https://placehold.co/400x600/1a1a1a/white?text=Sarah+W8', 'https://placehold.co/400x600/1a1a1a/white?text=Sarah+Side+W8', 'https://placehold.co/400x600/1a1a1a/white?text=Sarah+Back+W8',
            9, 9, 2, 10, 100, 100, NULL, 'Best shape of my life!', 'What maintenance looks like?', 'Moving to maintenance phase', false, NOW() - INTERVAL '6 days', admin_id);

    -- Alex Chen (client5): 1 check-in, PENDING review (new client)
    INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percent, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm,
        photo_front, photo_side, photo_back,
        energy_rating, sleep_rating, stress_rating, mood_rating, diet_adherence, workout_adherence,
        challenges, progress_notes, questions, admin_notes, flagged_for_followup, reviewed_at, reviewed_by)
    VALUES
        (client5_id, NOW() - INTERVAL '12 hours', 80.0, 20.0, 98, 82, 92, 34, 54,
            'https://placehold.co/400x600/1a1a1a/white?text=Alex+W1', 'https://placehold.co/400x600/1a1a1a/white?text=Alex+Side+W1', 'https://placehold.co/400x600/1a1a1a/white?text=Alex+Back+W1',
            8, 7, 4, 8, 85, 80,
            'Adjusting to new schedule', 'First week complete, excited to continue!', 'Am I eating enough protein?',
            NULL, false, NULL, NULL); -- PENDING REVIEW

    RAISE NOTICE 'Created check-ins for all clients';

    -- =============================================
    -- CREATE DIET PLANS (7 days for each client)
    -- =============================================

    -- Create diet plans for each client (reusing food items from nutrition seed)
    FOR day_num IN 1..7 LOOP
        -- Client 1 diet plan
        INSERT INTO diet_plans (client_id, day_number, meal_category, food_item_id, serving_multiplier, notes)
        VALUES
            (client1_id, day_num, 'pre-workout', '00000000-0000-0000-0000-000000000013', 1.0, NULL),
            (client1_id, day_num, 'breakfast', '00000000-0000-0000-0000-000000000009', 1.5, NULL),
            (client1_id, day_num, 'post-workout', '00000000-0000-0000-0000-000000000016', 1.0, NULL),
            (client1_id, day_num, 'lunch', '00000000-0000-0000-0000-000000000018', 1.0, NULL),
            (client1_id, day_num, 'evening-snack', '00000000-0000-0000-0000-000000000004', 1.0, NULL),
            (client1_id, day_num, 'dinner', '00000000-0000-0000-0000-000000000002', 1.5, NULL);

        -- Client 2 diet plan
        INSERT INTO diet_plans (client_id, day_number, meal_category, food_item_id, serving_multiplier, notes)
        VALUES
            (client2_id, day_num, 'breakfast', '00000000-0000-0000-0000-000000000003', 1.0, NULL),
            (client2_id, day_num, 'lunch', '00000000-0000-0000-0000-000000000019', 1.0, NULL),
            (client2_id, day_num, 'evening-snack', '00000000-0000-0000-0000-000000000015', 1.0, NULL),
            (client2_id, day_num, 'dinner', '00000000-0000-0000-0000-000000000006', 1.0, NULL);

        -- Client 3 diet plan
        INSERT INTO diet_plans (client_id, day_number, meal_category, food_item_id, serving_multiplier, notes)
        VALUES
            (client3_id, day_num, 'pre-workout', '00000000-0000-0000-0000-000000000013', 1.0, NULL),
            (client3_id, day_num, 'breakfast', '00000000-0000-0000-0000-000000000009', 1.0, NULL),
            (client3_id, day_num, 'post-workout', '00000000-0000-0000-0000-000000000016', 1.0, NULL),
            (client3_id, day_num, 'lunch', '00000000-0000-0000-0000-000000000001', 1.5, NULL),
            (client3_id, day_num, 'dinner', '00000000-0000-0000-0000-000000000020', 1.0, NULL);

        -- Client 4 diet plan
        INSERT INTO diet_plans (client_id, day_number, meal_category, food_item_id, serving_multiplier, notes)
        VALUES
            (client4_id, day_num, 'breakfast', '00000000-0000-0000-0000-000000000004', 1.5, NULL),
            (client4_id, day_num, 'lunch', '00000000-0000-0000-0000-000000000018', 1.0, NULL),
            (client4_id, day_num, 'evening-snack', '00000000-0000-0000-0000-000000000014', 1.0, NULL),
            (client4_id, day_num, 'dinner', '00000000-0000-0000-0000-000000000001', 1.0, NULL);

        -- Client 5 diet plan
        INSERT INTO diet_plans (client_id, day_number, meal_category, food_item_id, serving_multiplier, notes)
        VALUES
            (client5_id, day_num, 'breakfast', '00000000-0000-0000-0000-000000000009', 1.0, NULL),
            (client5_id, day_num, 'lunch', '00000000-0000-0000-0000-000000000001', 1.0, NULL),
            (client5_id, day_num, 'evening-snack', '00000000-0000-0000-0000-000000000004', 1.0, NULL),
            (client5_id, day_num, 'dinner', '00000000-0000-0000-0000-000000000002', 1.0, NULL);
    END LOOP;

    RAISE NOTICE 'Created diet plans for all clients';

    -- =============================================
    -- CREATE WORKOUT PLANS (7 days for each client)
    -- =============================================

    FOR day_num IN 1..7 LOOP
        -- Client 1, 3, 5: Standard workout plan
        INSERT INTO workout_plans (client_id, day_number, exercise_name, sets, reps, duration_minutes, rest_seconds, section, display_order)
        SELECT client_id, day_num, exercise_name, sets, reps, duration_minutes, rest_seconds, section, display_order
        FROM (
            VALUES
                ('warmup', 'Jumping Jacks', NULL, NULL, 3, 0, 1),
                ('warmup', 'Arm Circles', NULL, NULL, 2, 0, 2),
                ('main', 'Push-ups', 3, 15, NULL, 60, 3),
                ('main', 'Squats', 3, 15, NULL, 60, 4),
                ('main', 'Plank Hold', 3, NULL, 1, 30, 5),
                ('cooldown', 'Stretching', NULL, NULL, 5, 0, 6)
        ) AS w(section, exercise_name, sets, reps, duration_minutes, rest_seconds, display_order)
        CROSS JOIN (VALUES (client1_id), (client3_id), (client5_id)) AS c(client_id);

        -- Client 2, 4: Modified workout plan (lighter)
        INSERT INTO workout_plans (client_id, day_number, exercise_name, sets, reps, duration_minutes, rest_seconds, section, display_order)
        SELECT client_id, day_num, exercise_name, sets, reps, duration_minutes, rest_seconds, section, display_order
        FROM (
            VALUES
                ('warmup', 'Walking', NULL, NULL, 5, 0, 1),
                ('main', 'Wall Push-ups', 2, 10, NULL, 60, 2),
                ('main', 'Chair Squats', 2, 10, NULL, 60, 3),
                ('main', 'Glute Bridges', 2, 12, NULL, 45, 4),
                ('cooldown', 'Light Stretching', NULL, NULL, 5, 0, 5)
        ) AS w(section, exercise_name, sets, reps, duration_minutes, rest_seconds, display_order)
        CROSS JOIN (VALUES (client2_id), (client4_id)) AS c(client_id);
    END LOOP;

    RAISE NOTICE 'Created workout plans for all clients';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Admin test data seed completed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - 5 test client profiles';
    RAISE NOTICE '  - 21 check-ins (various states)';
    RAISE NOTICE '  - Diet plans for 7 days each';
    RAISE NOTICE '  - Workout plans for 7 days each';
    RAISE NOTICE '';
    RAISE NOTICE 'Test scenarios:';
    RAISE NOTICE '  - John Doe: Active, good progress, all reviewed';
    RAISE NOTICE '  - Jane Smith: FLAGGED, needs attention, 1 unreviewed';
    RAISE NOTICE '  - Mike Wilson: New client, 1 PENDING review';
    RAISE NOTICE '  - Sarah Johnson: Long-term success, all reviewed';
    RAISE NOTICE '  - Alex Chen: Brand new, 1 PENDING review';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected stats:';
    RAISE NOTICE '  - Total Clients: 5';
    RAISE NOTICE '  - Pending Reviews: 3';
    RAISE NOTICE '  - Flagged Clients: 1';
END $$;

-- Verify the data was created
SELECT '========== VERIFICATION ==========' as info;
SELECT 'Test Clients:' as info, COUNT(*) as count FROM profiles WHERE role = 'client';
SELECT 'Check-ins (Total):' as info, COUNT(*) as count FROM check_ins;
SELECT 'Check-ins (Pending):' as info, COUNT(*) as count FROM check_ins WHERE reviewed_at IS NULL;
SELECT 'Check-ins (Flagged):' as info, COUNT(*) as count FROM check_ins WHERE flagged_for_followup = true;
SELECT 'Diet Plans:' as info, COUNT(*) as count FROM diet_plans;
SELECT 'Workout Plans:' as info, COUNT(*) as count FROM workout_plans;
