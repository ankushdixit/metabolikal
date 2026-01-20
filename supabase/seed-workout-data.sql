-- Seed data for testing the Workout Module
-- Run this in Supabase SQL Editor or via CLI

-- Create workout plans for all test users in the database
DO $$
DECLARE
    user_record RECORD;
    day_num INT;
    user_count INT := 0;
BEGIN
    -- Loop through all client users
    FOR user_record IN
        SELECT id, full_name FROM profiles WHERE role = 'client' OR role IS NULL
    LOOP
        user_count := user_count + 1;
        RAISE NOTICE 'Creating workout plans for user: % (%)', user_record.full_name, user_record.id;

        -- Delete existing workout plans and logs for this user to avoid duplicates
        DELETE FROM workout_logs WHERE client_id = user_record.id;
        DELETE FROM workout_plans WHERE client_id = user_record.id;

        -- Create workout plans for days 1-7
        FOR day_num IN 1..7 LOOP
            -- WARMUP SECTION
            INSERT INTO workout_plans (client_id, day_number, exercise_name, sets, reps, duration_minutes, rest_seconds, instructions, video_url, section, display_order)
            VALUES
                (user_record.id, day_num, 'Jumping Jacks', NULL, NULL, 3, 0, 'Start with feet together, jump while spreading arms and legs wide, then return to starting position. Keep a steady pace.', 'https://www.youtube.com/watch?v=c4DAnQ6DtF8', 'warmup', 1),
                (user_record.id, day_num, 'Arm Circles', NULL, NULL, 2, 0, 'Extend arms to the sides and make small circles, gradually increasing to larger circles. Switch direction halfway through.', NULL, 'warmup', 2),
                (user_record.id, day_num, 'High Knees', NULL, NULL, 2, 0, 'Run in place while bringing knees up to hip level. Pump arms for momentum.', 'https://www.youtube.com/watch?v=ZZZoCNMU48U', 'warmup', 3);

            -- MAIN WORKOUT SECTION
            IF day_num IN (1, 4) THEN
                -- Upper body day
                INSERT INTO workout_plans (client_id, day_number, exercise_name, sets, reps, duration_minutes, rest_seconds, instructions, video_url, section, display_order)
                VALUES
                    (user_record.id, day_num, 'Push-ups', 3, 15, NULL, 60, 'Keep your body in a straight line from head to heels. Lower chest to the floor and push back up. Modify on knees if needed.', 'https://www.youtube.com/watch?v=IODxDxX7oi4', 'main', 4),
                    (user_record.id, day_num, 'Dumbbell Rows', 3, 12, NULL, 60, 'Hinge at hips with flat back. Pull dumbbell to hip, squeezing shoulder blade. Control the lowering phase.', 'https://www.youtube.com/watch?v=pYcpY20QaE8', 'main', 5),
                    (user_record.id, day_num, 'Shoulder Press', 3, 10, NULL, 60, 'Press dumbbells overhead until arms are fully extended. Keep core tight and avoid arching back.', 'https://www.youtube.com/watch?v=qEwKCR5JCog', 'main', 6),
                    (user_record.id, day_num, 'Bicep Curls', 3, 12, NULL, 45, 'Keep elbows close to body. Curl weights up with control, squeeze at top, lower slowly.', 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', 'main', 7),
                    (user_record.id, day_num, 'Tricep Dips', 3, 12, NULL, 45, 'Use a chair or bench. Lower body by bending elbows to 90 degrees, then push back up.', 'https://www.youtube.com/watch?v=0326dy_-CzM', 'main', 8);
            ELSIF day_num IN (2, 5) THEN
                -- Lower body day
                INSERT INTO workout_plans (client_id, day_number, exercise_name, sets, reps, duration_minutes, rest_seconds, instructions, video_url, section, display_order)
                VALUES
                    (user_record.id, day_num, 'Squats', 4, 15, NULL, 60, 'Stand shoulder-width apart. Sit back and down keeping chest up. Drive through heels to stand.', 'https://www.youtube.com/watch?v=aclHkVaku9U', 'main', 4),
                    (user_record.id, day_num, 'Lunges', 3, 12, NULL, 60, 'Step forward into lunge position. Both knees at 90 degrees. Alternate legs.', 'https://www.youtube.com/watch?v=QOVaHwm-Q6U', 'main', 5),
                    (user_record.id, day_num, 'Romanian Deadlifts', 3, 12, NULL, 60, 'Keep slight bend in knees. Hinge at hips pushing them back. Feel stretch in hamstrings.', 'https://www.youtube.com/watch?v=7j-2w4-P14I', 'main', 6),
                    (user_record.id, day_num, 'Calf Raises', 3, 20, NULL, 30, 'Stand on edge of step. Rise up on toes, hold briefly, lower with control.', 'https://www.youtube.com/watch?v=gwLzBJYoWlI', 'main', 7),
                    (user_record.id, day_num, 'Glute Bridges', 3, 15, NULL, 45, 'Lie on back with knees bent. Drive through heels lifting hips. Squeeze glutes at top.', 'https://www.youtube.com/watch?v=OUgsJ8-Vi0E', 'main', 8);
            ELSIF day_num IN (3, 6) THEN
                -- Core and cardio day
                INSERT INTO workout_plans (client_id, day_number, exercise_name, sets, reps, duration_minutes, rest_seconds, instructions, video_url, section, display_order)
                VALUES
                    (user_record.id, day_num, 'Plank Hold', 3, NULL, 1, 30, 'Hold body in straight line from head to heels. Engage core and don''t let hips sag.', 'https://www.youtube.com/watch?v=pSHjTRCQxIw', 'main', 4),
                    (user_record.id, day_num, 'Mountain Climbers', 3, 20, NULL, 30, 'In plank position, drive knees to chest alternating quickly. Keep hips down.', 'https://www.youtube.com/watch?v=nmwgirgXLYM', 'main', 5),
                    (user_record.id, day_num, 'Russian Twists', 3, 20, NULL, 30, 'Sit with knees bent, lean back slightly. Rotate torso side to side touching floor.', 'https://www.youtube.com/watch?v=wkD8rjkodUI', 'main', 6),
                    (user_record.id, day_num, 'Bicycle Crunches', 3, 20, NULL, 30, 'Lie on back, hands behind head. Bring opposite elbow to knee alternating sides.', 'https://www.youtube.com/watch?v=9FGilxCbdz8', 'main', 7),
                    (user_record.id, day_num, 'Burpees', 3, 10, NULL, 60, 'Start standing, drop to pushup, perform pushup, jump feet to hands, jump up with arms overhead.', 'https://www.youtube.com/watch?v=dZgVxmf6jkA', 'main', 8);
            ELSE
                -- Day 7: Active recovery / light day
                INSERT INTO workout_plans (client_id, day_number, exercise_name, sets, reps, duration_minutes, rest_seconds, instructions, video_url, section, display_order)
                VALUES
                    (user_record.id, day_num, 'Walking', NULL, NULL, 20, 0, 'Brisk walking at moderate pace. Keep arms swinging naturally.', NULL, 'main', 4),
                    (user_record.id, day_num, 'Light Yoga Flow', NULL, NULL, 15, 0, 'Gentle stretching and basic yoga poses. Focus on breathing and relaxation.', 'https://www.youtube.com/watch?v=v7AYKMP6rOE', 'main', 5);
            END IF;

            -- COOLDOWN SECTION
            INSERT INTO workout_plans (client_id, day_number, exercise_name, sets, reps, duration_minutes, rest_seconds, instructions, video_url, section, display_order)
            VALUES
                (user_record.id, day_num, 'Quad Stretch', NULL, NULL, 1, 0, 'Stand on one leg, pull foot to glute. Hold for 30 seconds each side.', NULL, 'cooldown', 10),
                (user_record.id, day_num, 'Hamstring Stretch', NULL, NULL, 1, 0, 'Sit with one leg extended. Reach toward toes keeping back straight. 30 seconds each side.', NULL, 'cooldown', 11),
                (user_record.id, day_num, 'Child''s Pose', NULL, NULL, 2, 0, 'Kneel and sit back on heels. Extend arms forward on floor and relax.', 'https://www.youtube.com/watch?v=2MJGg-dUKh0', 'cooldown', 12);

        END LOOP;

        RAISE NOTICE 'Created workout plan for all 7 days for user: %', user_record.full_name;
    END LOOP;

    IF user_count = 0 THEN
        RAISE NOTICE 'No users found in profiles table. Please run seed-test-users.sh first.';
    ELSE
        RAISE NOTICE 'Workout plans created successfully for % users!', user_count;
    END IF;
END $$;

-- Verify the data was created
SELECT 'Workout plans count:' as info, COUNT(*) as count FROM workout_plans;
SELECT 'Workout plans by section:' as info, section, COUNT(*) as count FROM workout_plans GROUP BY section ORDER BY section;
SELECT 'Workout plans per user:' as info, p.full_name, COUNT(wp.id) as workout_plans
FROM profiles p
LEFT JOIN workout_plans wp ON wp.client_id = p.id
WHERE p.role = 'client' OR p.role IS NULL
GROUP BY p.id, p.full_name;
