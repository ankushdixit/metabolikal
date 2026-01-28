-- =============================================================================
-- COMPREHENSIVE SEED DATA FOR METABOLI-K-AL
-- =============================================================================
--
-- This is the SINGLE SOURCE OF TRUTH for all seed data.
-- Run this file to populate a fresh database with all necessary data.
--
-- USAGE (Remote Supabase):
--   1. First create auth users:  ./supabase/seed-users.sh
--   2. Then run this seed:       Run in Supabase Dashboard SQL Editor
--                                OR: psql "$DATABASE_URL" -f supabase/seed.sql
--
-- USAGE (Local Supabase):
--   supabase db reset  (automatically runs migrations + seed.sql)
--
-- CONTENTS:
--   1. Configuration Data (meal_types, medical_conditions)
--   2. Master Libraries (supplements, exercises, lifestyle_activity_types)
--   3. Food Items
--   4. Test User Profiles (linked to auth users created by seed-users.sh)
--   5. Client Plans and Data
--
-- NOTE: Auth users (auth.users, auth.identities) are created separately via
--       seed-users.sh using the Supabase Admin API. This seed file only
--       handles public schema data.
--
-- =============================================================================

-- =============================================================================
-- SECTION 1: CONFIGURATION DATA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 MEAL TYPES
-- These define when meals can be scheduled
-- Note: These may already be seeded by migration 20260126100000_add_config_tables.sql
-- -----------------------------------------------------------------------------
INSERT INTO meal_types (name, slug, display_order, is_active) VALUES
  ('Pre-Workout', 'pre-workout', 1, true),
  ('Breakfast', 'breakfast', 2, true),
  ('Mid-Morning Snack', 'mid-morning-snack', 3, true),
  ('Lunch', 'lunch', 4, true),
  ('Evening Snack', 'evening-snack', 5, true),
  ('Post-Workout', 'post-workout', 6, true),
  ('Dinner', 'dinner', 7, true),
  ('Snack', 'snack', 8, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- -----------------------------------------------------------------------------
-- 1.2 MEDICAL CONDITIONS
-- These affect metabolic calculations with impact percentages
-- IMPORTANT: Slugs use hyphens (e.g., 'type2-diabetes') - this is the canonical format
-- Note: These may already be seeded by migration 20260126100000_add_config_tables.sql
-- -----------------------------------------------------------------------------
INSERT INTO medical_conditions (name, slug, impact_percent, gender_restriction, description, display_order, is_active) VALUES
  ('Hypothyroidism', 'hypothyroidism', 8, NULL, 'Underactive thyroid that slows metabolism', 1, true),
  ('PCOS', 'pcos', 10, 'female', 'Polycystic ovary syndrome affecting hormones and metabolism', 2, true),
  ('Type 2 Diabetes', 'type2-diabetes', 12, NULL, 'Metabolic disorder affecting insulin and blood sugar', 3, true),
  ('Insulin Resistance', 'insulin-resistance', 10, NULL, 'Reduced sensitivity to insulin affecting glucose metabolism', 4, true),
  ('Sleep Apnea', 'sleep-apnea', 7, NULL, 'Sleep disorder that affects metabolism and energy levels', 5, true),
  ('Metabolic Syndrome', 'metabolic-syndrome', 15, NULL, 'Cluster of conditions increasing heart disease and diabetes risk', 6, true),
  ('Thyroid Medication Managed', 'thyroid-managed', 3, NULL, 'Thyroid condition under control with medication', 7, true),
  ('Chronic Fatigue Syndrome', 'chronic-fatigue', 8, NULL, 'Persistent fatigue affecting energy expenditure', 8, true),
  ('None of the above', 'none', 0, NULL, 'No medical conditions affecting metabolism', 100, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  impact_percent = EXCLUDED.impact_percent,
  gender_restriction = EXCLUDED.gender_restriction,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;


-- =============================================================================
-- SECTION 2: MASTER LIBRARIES
-- =============================================================================
-- Note: These may already be seeded by migration 20260127000000_timeline_schema_and_libraries.sql

-- -----------------------------------------------------------------------------
-- 2.1 SUPPLEMENTS
-- Master library of supplement definitions
-- -----------------------------------------------------------------------------
INSERT INTO supplements (name, category, default_dosage, dosage_unit, instructions, notes, display_order, is_active) VALUES
  ('Fish Oil', 'fatty_acid', 2, 'capsule', 'Take with food for better absorption', 'Omega-3 fatty acids for heart and brain health', 1, true),
  ('Vitamin D3', 'vitamin', 2000, 'IU', 'Take with a meal containing fats', 'Essential for bone health and immune function', 2, true),
  ('Multivitamin', 'vitamin', 1, 'tablet', 'Take with breakfast', 'Daily essential vitamins and minerals', 3, true),
  ('Magnesium', 'mineral', 400, 'mg', 'Take before bed for better sleep', 'Supports muscle and nerve function', 4, true),
  ('Zinc', 'mineral', 15, 'mg', 'Take with food to avoid stomach upset', 'Supports immune function and wound healing', 5, true),
  ('Vitamin B Complex', 'vitamin', 1, 'capsule', 'Take with breakfast', 'Supports energy metabolism', 6, true),
  ('Whey Protein', 'protein', 1, 'scoop', 'Mix with water or milk', '25g protein per serving for muscle recovery', 7, true),
  ('Creatine Monohydrate', 'amino_acid', 5, 'g', 'Take daily, timing not critical', 'Supports strength and muscle performance', 8, true),
  ('BCAAs', 'amino_acid', 1, 'scoop', 'Take during or after workout', 'Branch chain amino acids for muscle recovery', 9, true),
  ('Ashwagandha', 'herbal', 300, 'mg', 'Take in evening', 'Adaptogen for stress management', 10, true),
  ('Probiotic', 'probiotic', 1, 'capsule', 'Take on empty stomach', 'Supports gut health and digestion', 11, true),
  ('Vitamin C', 'vitamin', 1000, 'mg', 'Take with meals', 'Antioxidant and immune support', 12, true)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2.2 EXERCISES
-- Master library of exercise definitions
-- -----------------------------------------------------------------------------
INSERT INTO exercises (name, category, muscle_group, equipment, default_sets, default_reps, default_duration_seconds, rest_seconds, difficulty_level, display_order, is_active) VALUES
  -- Chest
  ('Bench Press', 'strength', 'chest', 'barbell', 4, 8, NULL, 90, 3, 1, true),
  ('Incline Dumbbell Press', 'strength', 'chest', 'dumbbell', 3, 10, NULL, 60, 2, 2, true),
  ('Push-ups', 'strength', 'chest', 'bodyweight', 3, 15, NULL, 45, 1, 3, true),
  ('Cable Flyes', 'strength', 'chest', 'cable', 3, 12, NULL, 60, 2, 4, true),
  -- Back
  ('Deadlift', 'strength', 'back', 'barbell', 4, 6, NULL, 120, 4, 5, true),
  ('Bent Over Row', 'strength', 'back', 'barbell', 4, 8, NULL, 90, 3, 6, true),
  ('Lat Pulldown', 'strength', 'back', 'cable', 3, 10, NULL, 60, 2, 7, true),
  ('Pull-ups', 'strength', 'back', 'bodyweight', 3, 8, NULL, 90, 3, 8, true),
  -- Shoulders
  ('Overhead Press', 'strength', 'shoulders', 'barbell', 4, 8, NULL, 90, 3, 9, true),
  ('Lateral Raises', 'strength', 'shoulders', 'dumbbell', 3, 12, NULL, 45, 2, 10, true),
  ('Face Pulls', 'strength', 'shoulders', 'cable', 3, 15, NULL, 45, 2, 11, true),
  -- Arms
  ('Barbell Curl', 'strength', 'biceps', 'barbell', 3, 10, NULL, 60, 2, 12, true),
  ('Tricep Pushdown', 'strength', 'triceps', 'cable', 3, 12, NULL, 45, 2, 13, true),
  ('Hammer Curl', 'strength', 'biceps', 'dumbbell', 3, 10, NULL, 45, 2, 14, true),
  -- Legs
  ('Squat', 'strength', 'quadriceps', 'barbell', 4, 8, NULL, 120, 4, 15, true),
  ('Romanian Deadlift', 'strength', 'hamstrings', 'barbell', 3, 10, NULL, 90, 3, 16, true),
  ('Leg Press', 'strength', 'quadriceps', 'machine', 3, 12, NULL, 90, 2, 17, true),
  ('Leg Curl', 'strength', 'hamstrings', 'machine', 3, 12, NULL, 60, 2, 18, true),
  ('Calf Raises', 'strength', 'calves', 'machine', 4, 15, NULL, 45, 1, 19, true),
  ('Hip Thrust', 'strength', 'glutes', 'barbell', 3, 12, NULL, 90, 3, 20, true),
  ('Lunges', 'strength', 'quadriceps', 'dumbbell', 3, 10, NULL, 60, 2, 21, true),
  -- Core
  ('Plank', 'strength', 'core', 'bodyweight', 3, NULL, 60, 45, 1, 22, true),
  ('Russian Twist', 'strength', 'core', 'bodyweight', 3, 20, NULL, 30, 2, 23, true),
  ('Hanging Leg Raises', 'strength', 'core', 'bodyweight', 3, 12, NULL, 60, 3, 24, true),
  ('Cable Crunch', 'strength', 'core', 'cable', 3, 15, NULL, 45, 2, 25, true),
  -- Cardio
  ('Treadmill Running', 'cardio', 'full_body', NULL, 1, NULL, 1800, 0, 2, 26, true),
  ('Cycling', 'cardio', 'full_body', 'machine', 1, NULL, 1800, 0, 2, 27, true),
  ('Rowing', 'cardio', 'full_body', 'machine', 1, NULL, 1200, 0, 3, 28, true),
  ('Jump Rope', 'cardio', 'full_body', NULL, 3, NULL, 180, 60, 2, 29, true),
  -- HIIT
  ('Burpees', 'hiit', 'full_body', 'bodyweight', 4, 10, NULL, 30, 3, 30, true),
  ('Mountain Climbers', 'hiit', 'core', 'bodyweight', 4, NULL, 30, 15, 2, 31, true),
  ('Box Jumps', 'hiit', 'quadriceps', NULL, 4, 10, NULL, 30, 3, 32, true),
  -- Warmup
  ('Arm Circles', 'warmup', 'shoulders', 'bodyweight', 2, 15, NULL, 0, 1, 33, true),
  ('Jumping Jacks', 'warmup', 'full_body', 'bodyweight', 2, 20, NULL, 0, 1, 34, true),
  ('Dynamic Stretching', 'warmup', 'full_body', 'bodyweight', 1, NULL, 300, 0, 1, 35, true),
  -- Cooldown
  ('Static Stretching', 'cooldown', 'full_body', 'bodyweight', 1, NULL, 600, 0, 1, 36, true),
  ('Foam Rolling', 'cooldown', 'full_body', NULL, 1, NULL, 300, 0, 1, 37, true)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2.3 LIFESTYLE ACTIVITY TYPES
-- Master library of lifestyle activities
-- -----------------------------------------------------------------------------
INSERT INTO lifestyle_activity_types (name, category, default_target_value, target_unit, description, rationale, icon, display_order, is_active) VALUES
  ('Daily Steps', 'movement', 10000, 'steps', 'Track your daily step count', 'Walking improves cardiovascular health and helps maintain a healthy weight', 'footprints', 1, true),
  ('Morning Sunlight', 'sunlight', 15, 'minutes', 'Get morning sunlight exposure', 'Morning light helps regulate circadian rhythm and improves vitamin D production', 'sun', 2, true),
  ('Water Intake', 'hydration', 8, 'glasses', 'Track your daily water consumption', 'Proper hydration supports metabolism, energy levels, and overall health', 'droplet', 3, true),
  ('Sleep Duration', 'sleep', 8, 'hours', 'Track your nightly sleep', 'Quality sleep is essential for recovery, hormone regulation, and mental clarity', 'moon', 4, true),
  ('Meditation', 'mindfulness', 10, 'minutes', 'Daily meditation practice', 'Meditation reduces stress, improves focus, and supports emotional well-being', 'brain', 5, true),
  ('Journaling', 'mindfulness', 1, 'entry', 'Daily journaling session', 'Journaling promotes self-reflection, reduces stress, and improves mental clarity', 'book-open', 6, true),
  ('Deep Breathing', 'mindfulness', 5, 'minutes', 'Deep breathing exercises', 'Activates parasympathetic nervous system for stress relief', 'wind', 7, true),
  ('Stretching', 'recovery', 10, 'minutes', 'Daily stretching routine', 'Improves flexibility, reduces injury risk, and aids muscle recovery', 'activity', 8, true),
  ('Cold Exposure', 'recovery', 2, 'minutes', 'Cold shower or ice bath', 'Supports immune function, reduces inflammation, and improves mental resilience', 'snowflake', 9, true),
  ('Walking', 'movement', 30, 'minutes', 'Dedicated walking session', 'Low-impact exercise that improves cardiovascular health without excessive strain', 'walking', 10, true),
  ('Screen-Free Time', 'recovery', 60, 'minutes', 'Time away from screens', 'Reduces eye strain and improves sleep quality by limiting blue light exposure', 'eye-off', 11, true),
  ('Social Connection', 'social', 30, 'minutes', 'Quality time with loved ones', 'Social connections improve mental health and longevity', 'users', 12, true)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 3: FOOD ITEMS
-- =============================================================================

-- Use fixed UUIDs for food items so they can be referenced in diet plans
INSERT INTO food_items (id, name, calories, protein, carbs, fats, serving_size, is_vegetarian, meal_types) VALUES
  -- High protein options
  ('00000000-0000-0000-0000-000000000001', 'Grilled Chicken Breast', 165, 31, 0, 4, '100g', false, ARRAY['pre-workout', 'post-workout', 'lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000002', 'Salmon Fillet', 208, 20, 0, 13, '100g', false, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000003', 'Greek Yogurt', 100, 17, 6, 1, '170g', true, ARRAY['breakfast', 'snack']),
  ('00000000-0000-0000-0000-000000000004', 'Eggs (2 large)', 156, 13, 1, 11, '2 eggs', true, ARRAY['breakfast', 'snack']),
  ('00000000-0000-0000-0000-000000000005', 'Cottage Cheese', 98, 11, 3, 4, '100g', true, ARRAY['breakfast', 'snack']),
  ('00000000-0000-0000-0000-000000000006', 'Turkey Breast', 135, 30, 0, 1, '100g', false, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000007', 'Tuna (canned)', 116, 26, 0, 1, '100g', false, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000008', 'Tofu (firm)', 144, 17, 3, 8, '150g', true, ARRAY['lunch', 'dinner']),
  -- Carbohydrate sources
  ('00000000-0000-0000-0000-000000000009', 'Brown Rice', 216, 5, 45, 2, '1 cup cooked', true, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000010', 'Sweet Potato', 103, 2, 24, 0, '100g', true, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000011', 'Oatmeal', 158, 6, 27, 3, '1 cup cooked', true, ARRAY['breakfast']),
  ('00000000-0000-0000-0000-000000000012', 'Quinoa', 222, 8, 39, 4, '1 cup cooked', true, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000013', 'Banana', 105, 1, 27, 0, '1 medium', true, ARRAY['pre-workout', 'snack', 'breakfast']),
  ('00000000-0000-0000-0000-000000000014', 'Apple', 95, 0, 25, 0, '1 medium', true, ARRAY['snack']),
  -- Healthy fats
  ('00000000-0000-0000-0000-000000000015', 'Avocado', 160, 2, 9, 15, '1/2 avocado', true, ARRAY['breakfast', 'lunch', 'dinner', 'snack']),
  ('00000000-0000-0000-0000-000000000016', 'Almonds', 164, 6, 6, 14, '28g (1oz)', true, ARRAY['snack', 'post-workout']),
  ('00000000-0000-0000-0000-000000000017', 'Olive Oil', 119, 0, 0, 14, '1 tbsp', true, ARRAY['lunch', 'dinner']),
  -- Complete meals
  ('00000000-0000-0000-0000-000000000018', 'Chicken Rice Bowl', 450, 35, 45, 10, '1 bowl', false, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000019', 'Vegetable Stir Fry with Tofu', 320, 18, 30, 15, '1 serving', true, ARRAY['lunch', 'dinner']),
  ('00000000-0000-0000-0000-000000000020', 'Grilled Fish with Vegetables', 380, 35, 20, 18, '1 plate', false, ARRAY['lunch', 'dinner'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fats = EXCLUDED.fats,
  serving_size = EXCLUDED.serving_size,
  is_vegetarian = EXCLUDED.is_vegetarian,
  meal_types = EXCLUDED.meal_types;


-- =============================================================================
-- SECTION 4: TEST USER PROFILES AND DATA
-- =============================================================================
--
-- IMPORTANT: Auth users must be created FIRST via seed-users.sh before running this.
-- The seed-users.sh script creates auth users via Supabase Admin API, which triggers
-- automatic profile creation. This section UPDATES those profiles with test data.
--
-- Test User Scenarios:
--   ADMIN:
--     1. Admin user (for managing all data)
--   CLIENTS:
--     2. Active client with good progress
--     3. Struggling client (flagged for follow-up)
--     4. New client (pending reviews)
--     5. Long-term success client
--     6. Brand new client (just started)
--     7. Deactivated client (for testing filters)
--     8. Client with medical conditions (for testing condition filtering)
--   CHALLENGERS:
--     9. Active challenger (mid-challenge, good progress)
--    10. Completed challenger (finished 30-day challenge)
--    11. New challenger (just started, day 1)
--    12. Inactive challenger (started but stopped)
--    13. Challenger ready for upgrade (completed, high engagement)
-- =============================================================================

DO $$
DECLARE
    -- Fixed UUIDs for predictable testing (must match seed-users.sh)
    admin_id UUID := '00000000-0000-0000-0000-000000000100';
    -- Clients (0x02XX)
    client_active_id UUID := '00000000-0000-0000-0000-000000000201';
    client_struggling_id UUID := '00000000-0000-0000-0000-000000000202';
    client_new_id UUID := '00000000-0000-0000-0000-000000000203';
    client_success_id UUID := '00000000-0000-0000-0000-000000000204';
    client_brand_new_id UUID := '00000000-0000-0000-0000-000000000205';
    client_deactivated_id UUID := '00000000-0000-0000-0000-000000000206';
    client_conditions_id UUID := '00000000-0000-0000-0000-000000000207';
    -- Challengers (0x03XX)
    challenger_active_id UUID := '00000000-0000-0000-0000-000000000301';
    challenger_completed_id UUID := '00000000-0000-0000-0000-000000000302';
    challenger_new_id UUID := '00000000-0000-0000-0000-000000000303';
    challenger_inactive_id UUID := '00000000-0000-0000-0000-000000000304';
    challenger_upgrade_id UUID := '00000000-0000-0000-0000-000000000305';
    day_num INT;
BEGIN
    RAISE NOTICE 'Starting comprehensive seed...';
    RAISE NOTICE 'NOTE: Auth users should already exist (created by seed-users.sh)';

    -- =============================================
    -- PROFILES (Update existing or insert if missing)
    -- =============================================
    -- The trigger creates profiles when auth users are created,
    -- so we use INSERT ... ON CONFLICT to update with our test data.

    -- Admin User
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (admin_id, 'admin@metabolikal.com', 'Admin User', '+1000000000', 'admin', NOW() - INTERVAL '90 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;

    -- Client 1: Active with good progress (45 days)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (client_active_id, 'active.client@test.com', 'Alex Thompson', '+1111111111', 'client', NOW() - INTERVAL '45 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;

    -- Client 2: Struggling (flagged for follow-up)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (client_struggling_id, 'struggling.client@test.com', 'Jordan Martinez', '+2222222222', 'client', NOW() - INTERVAL '30 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;

    -- Client 3: New client with pending reviews
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (client_new_id, 'new.client@test.com', 'Sam Wilson', '+3333333333', 'client', NOW() - INTERVAL '14 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;

    -- Client 4: Long-term success
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (client_success_id, 'success.client@test.com', 'Morgan Chen', '+4444444444', 'client', NOW() - INTERVAL '90 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;

    -- Client 5: Brand new (just started)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (client_brand_new_id, 'brandnew.client@test.com', 'Casey Rivera', '+5555555555', 'client', NOW() - INTERVAL '3 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;

    -- Client 6: Deactivated
    INSERT INTO profiles (id, email, full_name, phone, role, is_deactivated, deactivated_at, deactivation_reason, created_at)
    VALUES (client_deactivated_id, 'deactivated.client@test.com', 'Taylor Brown', '+6666666666', 'client', true, NOW() - INTERVAL '10 days', 'Requested pause', NOW() - INTERVAL '60 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        is_deactivated = EXCLUDED.is_deactivated,
        deactivated_at = EXCLUDED.deactivated_at,
        deactivation_reason = EXCLUDED.deactivation_reason;

    -- Client 7: Has medical conditions (female for PCOS testing)
    INSERT INTO profiles (id, email, full_name, phone, role, gender, created_at)
    VALUES (client_conditions_id, 'conditions.client@test.com', 'Jamie Parker', '+7777777777', 'client', 'female', NOW() - INTERVAL '30 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        gender = EXCLUDED.gender;

    -- =============================================
    -- CHALLENGER PROFILES
    -- =============================================

    -- Challenger 1: Active challenger (mid-challenge, day 15, good progress)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger_active_id, 'active.challenger@test.com', 'Riley Johnson', '+3011111111', 'challenger', NOW() - INTERVAL '15 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;

    -- Challenger 2: Completed challenger (finished 30-day challenge)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger_completed_id, 'completed.challenger@test.com', 'Avery Williams', '+3022222222', 'challenger', NOW() - INTERVAL '35 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;

    -- Challenger 3: New challenger (just started, day 1)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger_new_id, 'new.challenger@test.com', 'Quinn Davis', '+3033333333', 'challenger', NOW() - INTERVAL '1 day')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;

    -- Challenger 4: Inactive challenger (started 20 days ago but stopped at day 5)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger_inactive_id, 'inactive.challenger@test.com', 'Peyton Miller', '+3044444444', 'challenger', NOW() - INTERVAL '20 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;

    -- Challenger 5: Ready for upgrade (completed challenge with high engagement)
    INSERT INTO profiles (id, email, full_name, phone, role, created_at)
    VALUES (challenger_upgrade_id, 'upgrade.challenger@test.com', 'Cameron Lee', '+3055555555', 'challenger', NOW() - INTERVAL '32 days')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;

    RAISE NOTICE 'Created/updated profiles (1 admin, 7 clients, 5 challengers)';

    -- =============================================
    -- CHECK-INS
    -- =============================================

    -- Active client: 6 check-ins, all reviewed, showing progress
    INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percent, energy_rating, sleep_rating, stress_rating, mood_rating, diet_adherence, workout_adherence, progress_notes, admin_notes, flagged_for_followup, reviewed_at, reviewed_by)
    VALUES
        (client_active_id, NOW() - INTERVAL '42 days', 92.0, 24.0, 6, 7, 5, 6, 70, 65, 'First week complete!', 'Good start', false, NOW() - INTERVAL '41 days', admin_id),
        (client_active_id, NOW() - INTERVAL '35 days', 90.5, 23.5, 7, 7, 4, 7, 80, 75, 'Getting into rhythm', 'Great progress', false, NOW() - INTERVAL '34 days', admin_id),
        (client_active_id, NOW() - INTERVAL '28 days', 89.0, 22.8, 8, 8, 3, 8, 85, 85, 'Feeling stronger', 'Excellent!', false, NOW() - INTERVAL '27 days', admin_id),
        (client_active_id, NOW() - INTERVAL '21 days', 87.5, 22.0, 8, 7, 4, 8, 90, 90, 'Great week despite stress', 'Handling well', false, NOW() - INTERVAL '20 days', admin_id),
        (client_active_id, NOW() - INTERVAL '14 days', 86.0, 21.5, 9, 8, 3, 9, 95, 95, 'Best week yet!', 'Outstanding', false, NOW() - INTERVAL '13 days', admin_id),
        (client_active_id, NOW() - INTERVAL '7 days', 85.0, 21.0, 9, 9, 2, 9, 95, 100, 'Abs showing!', 'Incredible', false, NOW() - INTERVAL '6 days', admin_id)
    ON CONFLICT DO NOTHING;

    -- Struggling client: Latest flagged and unreviewed
    INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percent, energy_rating, sleep_rating, stress_rating, mood_rating, diet_adherence, workout_adherence, challenges, progress_notes, admin_notes, flagged_for_followup, reviewed_at, reviewed_by)
    VALUES
        (client_struggling_id, NOW() - INTERVAL '28 days', 72.0, 28.0, 7, 6, 5, 6, 75, 70, NULL, 'Starting strong', 'Good start', false, NOW() - INTERVAL '27 days', admin_id),
        (client_struggling_id, NOW() - INTERVAL '21 days', 71.5, 27.5, 6, 5, 6, 5, 65, 60, 'Work schedule issues', 'Struggling', 'Adjusted plan', false, NOW() - INTERVAL '20 days', admin_id),
        (client_struggling_id, NOW() - INTERVAL '14 days', 72.5, 28.2, 4, 4, 8, 4, 50, 40, 'Gained weight back', 'Feeling discouraged', 'Scheduled call', true, NOW() - INTERVAL '13 days', admin_id),
        (client_struggling_id, NOW() - INTERVAL '2 days', 73.0, 28.5, 3, 3, 9, 3, 40, 30, 'Life stress overwhelming', 'Need help', NULL, true, NULL, NULL)
    ON CONFLICT DO NOTHING;

    -- New client: Pending review
    INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percent, energy_rating, sleep_rating, stress_rating, mood_rating, diet_adherence, workout_adherence, progress_notes, admin_notes, flagged_for_followup, reviewed_at, reviewed_by)
    VALUES
        (client_new_id, NOW() - INTERVAL '7 days', 85.0, 22.0, 7, 7, 4, 7, 80, 85, 'First week done!', 'Good start', false, NOW() - INTERVAL '6 days', admin_id),
        (client_new_id, NOW() - INTERVAL '1 day', 84.2, 21.5, 8, 8, 3, 8, 85, 90, 'Feeling great', NULL, false, NULL, NULL)
    ON CONFLICT DO NOTHING;

    -- Success client: Long history, all reviewed
    INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percent, energy_rating, sleep_rating, stress_rating, mood_rating, diet_adherence, workout_adherence, progress_notes, admin_notes, flagged_for_followup, reviewed_at, reviewed_by)
    VALUES
        (client_success_id, NOW() - INTERVAL '84 days', 88.0, 32.0, 6, 6, 5, 6, 70, 70, 'Starting', 'Welcome', false, NOW() - INTERVAL '83 days', admin_id),
        (client_success_id, NOW() - INTERVAL '70 days', 86.0, 30.0, 7, 7, 4, 7, 75, 80, 'Progressing', 'Good', false, NOW() - INTERVAL '69 days', admin_id),
        (client_success_id, NOW() - INTERVAL '56 days', 83.0, 28.0, 8, 7, 4, 8, 80, 85, 'Getting better', 'Great', false, NOW() - INTERVAL '55 days', admin_id),
        (client_success_id, NOW() - INTERVAL '42 days', 80.0, 26.0, 8, 8, 3, 8, 85, 90, 'Feeling amazing', 'Excellent', false, NOW() - INTERVAL '41 days', admin_id),
        (client_success_id, NOW() - INTERVAL '28 days', 77.0, 24.0, 9, 8, 3, 9, 90, 95, 'Best shape ever', 'Outstanding', false, NOW() - INTERVAL '27 days', admin_id),
        (client_success_id, NOW() - INTERVAL '14 days', 75.0, 22.0, 9, 9, 2, 9, 95, 100, 'Goal reached!', 'Maintenance phase', false, NOW() - INTERVAL '13 days', admin_id),
        (client_success_id, NOW() - INTERVAL '7 days', 75.0, 22.0, 9, 9, 2, 10, 100, 100, 'Maintaining perfectly', 'Star client', false, NOW() - INTERVAL '6 days', admin_id)
    ON CONFLICT DO NOTHING;

    -- Brand new: First check-in pending
    INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percent, energy_rating, sleep_rating, stress_rating, mood_rating, diet_adherence, workout_adherence, progress_notes, flagged_for_followup, reviewed_at, reviewed_by)
    VALUES
        (client_brand_new_id, NOW() - INTERVAL '12 hours', 82.0, 25.0, 7, 6, 5, 7, 75, 70, 'Day 1 complete!', false, NULL, NULL)
    ON CONFLICT DO NOTHING;

    -- Conditions client: Has conditions logged
    INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percent, energy_rating, sleep_rating, stress_rating, mood_rating, diet_adherence, workout_adherence, progress_notes, admin_notes, flagged_for_followup, reviewed_at, reviewed_by)
    VALUES
        (client_conditions_id, NOW() - INTERVAL '21 days', 75.0, 30.0, 5, 5, 6, 5, 70, 60, 'Fatigue from PCOS', 'Adjusting plan for conditions', false, NOW() - INTERVAL '20 days', admin_id),
        (client_conditions_id, NOW() - INTERVAL '14 days', 74.5, 29.5, 6, 6, 5, 6, 75, 70, 'Energy improving', 'Supplements helping', false, NOW() - INTERVAL '13 days', admin_id),
        (client_conditions_id, NOW() - INTERVAL '7 days', 74.0, 29.0, 7, 7, 4, 7, 80, 75, 'Making progress', 'Great adaptation', false, NOW() - INTERVAL '6 days', admin_id)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created check-ins';

    -- =============================================
    -- DIET PLANS (7 days for active clients)
    -- =============================================

    FOR day_num IN 1..7 LOOP
        -- Active client diet
        INSERT INTO diet_plans (client_id, day_number, meal_category, food_item_id, serving_multiplier) VALUES
            (client_active_id, day_num, 'pre-workout', '00000000-0000-0000-0000-000000000013', 1.0),
            (client_active_id, day_num, 'breakfast', '00000000-0000-0000-0000-000000000011', 1.5),
            (client_active_id, day_num, 'post-workout', '00000000-0000-0000-0000-000000000016', 1.0),
            (client_active_id, day_num, 'lunch', '00000000-0000-0000-0000-000000000018', 1.0),
            (client_active_id, day_num, 'evening-snack', '00000000-0000-0000-0000-000000000004', 1.0),
            (client_active_id, day_num, 'dinner', '00000000-0000-0000-0000-000000000002', 1.5)
        ON CONFLICT DO NOTHING;

        -- Success client diet
        INSERT INTO diet_plans (client_id, day_number, meal_category, food_item_id, serving_multiplier) VALUES
            (client_success_id, day_num, 'breakfast', '00000000-0000-0000-0000-000000000011', 1.0),
            (client_success_id, day_num, 'lunch', '00000000-0000-0000-0000-000000000018', 1.0),
            (client_success_id, day_num, 'evening-snack', '00000000-0000-0000-0000-000000000003', 1.0),
            (client_success_id, day_num, 'dinner', '00000000-0000-0000-0000-000000000020', 1.0)
        ON CONFLICT DO NOTHING;

        -- New client diet
        INSERT INTO diet_plans (client_id, day_number, meal_category, food_item_id, serving_multiplier) VALUES
            (client_new_id, day_num, 'breakfast', '00000000-0000-0000-0000-000000000004', 1.5),
            (client_new_id, day_num, 'lunch', '00000000-0000-0000-0000-000000000001', 1.0),
            (client_new_id, day_num, 'dinner', '00000000-0000-0000-0000-000000000019', 1.0)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Created diet plans';

    -- =============================================
    -- WORKOUT PLANS (7 days for active clients)
    -- =============================================

    FOR day_num IN 1..7 LOOP
        -- Active client workout
        INSERT INTO workout_plans (client_id, day_number, exercise_name, sets, reps, duration_minutes, rest_seconds, section, display_order) VALUES
            (client_active_id, day_num, 'Jumping Jacks', NULL, NULL, 3, 0, 'warmup', 1),
            (client_active_id, day_num, 'Dynamic Stretching', NULL, NULL, 2, 0, 'warmup', 2),
            (client_active_id, day_num, 'Push-ups', 3, 15, NULL, 60, 'main', 3),
            (client_active_id, day_num, 'Squat', 4, 12, NULL, 60, 'main', 4),
            (client_active_id, day_num, 'Plank', 3, NULL, 1, 30, 'main', 5),
            (client_active_id, day_num, 'Lunges', 3, 10, NULL, 45, 'main', 6),
            (client_active_id, day_num, 'Static Stretching', NULL, NULL, 5, 0, 'cooldown', 7)
        ON CONFLICT DO NOTHING;

        -- Success client workout (maintenance phase)
        INSERT INTO workout_plans (client_id, day_number, exercise_name, sets, reps, duration_minutes, rest_seconds, section, display_order) VALUES
            (client_success_id, day_num, 'Arm Circles', NULL, NULL, 2, 0, 'warmup', 1),
            (client_success_id, day_num, 'Bench Press', 4, 8, NULL, 90, 'main', 2),
            (client_success_id, day_num, 'Bent Over Row', 4, 8, NULL, 90, 'main', 3),
            (client_success_id, day_num, 'Overhead Press', 3, 10, NULL, 60, 'main', 4),
            (client_success_id, day_num, 'Foam Rolling', NULL, NULL, 5, 0, 'cooldown', 5)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Created workout plans';

    -- =============================================
    -- CHALLENGER DATA: CALCULATOR RESULTS
    -- =============================================

    -- Active challenger calculator results
    INSERT INTO calculator_results (user_id, gender, age, weight_kg, height_cm, body_fat_percent, activity_level, goal, goal_weight_kg, medical_conditions, bmr, tdee, target_calories, protein_grams, carbs_grams, fats_grams, metabolic_impact_percent)
    VALUES
        (challenger_active_id, 'male', 28, 82.0, 178, 18.0, 'moderately_active', 'fat_loss', 75.0, ARRAY[]::TEXT[], 1812, 2809, 2309, 164, 230, 64, 0),
        (challenger_completed_id, 'female', 32, 65.0, 165, 24.0, 'lightly_active', 'fat_loss', 58.0, ARRAY['hypothyroidism'], 1380, 1898, 1398, 130, 140, 39, 8),
        (challenger_new_id, 'male', 25, 90.0, 182, NULL, 'sedentary', 'fat_loss', 80.0, ARRAY[]::TEXT[], 1880, 2256, 1756, 180, 175, 49, 0),
        (challenger_inactive_id, 'female', 29, 70.0, 168, 28.0, 'lightly_active', 'maintain', 70.0, ARRAY[]::TEXT[], 1450, 1994, 1994, 126, 250, 55, 0),
        (challenger_upgrade_id, 'male', 35, 78.0, 175, 15.0, 'very_active', 'muscle_gain', 82.0, ARRAY[]::TEXT[], 1750, 3019, 3319, 172, 414, 92, 0)
    ON CONFLICT (user_id) DO UPDATE SET
        gender = EXCLUDED.gender,
        age = EXCLUDED.age,
        weight_kg = EXCLUDED.weight_kg,
        height_cm = EXCLUDED.height_cm,
        body_fat_percent = EXCLUDED.body_fat_percent,
        activity_level = EXCLUDED.activity_level,
        goal = EXCLUDED.goal,
        goal_weight_kg = EXCLUDED.goal_weight_kg,
        medical_conditions = EXCLUDED.medical_conditions,
        bmr = EXCLUDED.bmr,
        tdee = EXCLUDED.tdee,
        target_calories = EXCLUDED.target_calories,
        protein_grams = EXCLUDED.protein_grams,
        carbs_grams = EXCLUDED.carbs_grams,
        fats_grams = EXCLUDED.fats_grams,
        metabolic_impact_percent = EXCLUDED.metabolic_impact_percent;

    RAISE NOTICE 'Created calculator results for challengers';

    -- =============================================
    -- CHALLENGER DATA: ASSESSMENT RESULTS
    -- =============================================

    -- Delete existing assessment results for these users (fresh start)
    DELETE FROM assessment_results WHERE user_id IN (
        challenger_active_id, challenger_completed_id, challenger_new_id,
        challenger_inactive_id, challenger_upgrade_id
    );

    INSERT INTO assessment_results (user_id, visitor_id, sleep_score, body_score, nutrition_score, mental_score, stress_score, support_score, hydration_score, health_score, lifestyle_score)
    VALUES
        (challenger_active_id, gen_random_uuid()::text, 7, 6, 7, 8, 6, 7, 6, 70, 65),
        (challenger_completed_id, gen_random_uuid()::text, 8, 7, 8, 8, 7, 8, 8, 80, 75),
        (challenger_new_id, gen_random_uuid()::text, 5, 4, 5, 6, 4, 5, 5, 50, 45),
        (challenger_inactive_id, gen_random_uuid()::text, 6, 5, 5, 5, 5, 6, 5, 55, 50),
        (challenger_upgrade_id, gen_random_uuid()::text, 9, 8, 9, 9, 8, 9, 9, 90, 85);

    RAISE NOTICE 'Created assessment results for challengers';

    -- =============================================
    -- CHALLENGER DATA: CHALLENGE PROGRESS
    -- =============================================

    -- Delete existing challenge progress for these users
    DELETE FROM challenge_progress WHERE user_id IN (
        challenger_active_id, challenger_completed_id, challenger_new_id,
        challenger_inactive_id, challenger_upgrade_id
    );

    -- Active challenger: 15 days of progress (good engagement)
    FOR day_num IN 1..15 LOOP
        INSERT INTO challenge_progress (visitor_id, user_id, day_number, logged_date, steps, water_liters, floors_climbed, protein_grams, sleep_hours, feeling, points_earned)
        VALUES (
            challenger_active_id::text,
            challenger_active_id,
            day_num,
            CURRENT_DATE - (16 - day_num),
            8000 + (random() * 4000)::int,
            2.0 + (random() * 1.5)::numeric(3,1),
            5 + (random() * 10)::int,
            120 + (random() * 40)::int,
            7.0 + (random() * 1.5)::numeric(3,1),
            CASE WHEN random() > 0.3 THEN 'great' ELSE 'good' END,
            80 + (random() * 20)::int
        );
    END LOOP;

    -- Completed challenger: All 30 days completed
    FOR day_num IN 1..30 LOOP
        INSERT INTO challenge_progress (visitor_id, user_id, day_number, logged_date, steps, water_liters, floors_climbed, protein_grams, sleep_hours, feeling, points_earned)
        VALUES (
            challenger_completed_id::text,
            challenger_completed_id,
            day_num,
            CURRENT_DATE - (35 - day_num),
            9000 + (random() * 3000)::int,
            2.5 + (random() * 1.0)::numeric(3,1),
            8 + (random() * 12)::int,
            140 + (random() * 30)::int,
            7.5 + (random() * 1.0)::numeric(3,1),
            'great',
            90 + (random() * 10)::int
        );
    END LOOP;

    -- New challenger: Only day 1 completed
    INSERT INTO challenge_progress (visitor_id, user_id, day_number, logged_date, steps, water_liters, floors_climbed, protein_grams, sleep_hours, feeling, points_earned)
    VALUES (
        challenger_new_id::text,
        challenger_new_id,
        1,
        CURRENT_DATE - 1,
        5000,
        1.5,
        3,
        80,
        6.5,
        'okay',
        50
    );

    -- Inactive challenger: Days 1-5 completed, then stopped
    FOR day_num IN 1..5 LOOP
        INSERT INTO challenge_progress (visitor_id, user_id, day_number, logged_date, steps, water_liters, floors_climbed, protein_grams, sleep_hours, feeling, points_earned)
        VALUES (
            challenger_inactive_id::text,
            challenger_inactive_id,
            day_num,
            CURRENT_DATE - (20 - day_num),
            6000 + (random() * 2000)::int,
            1.5 + (random() * 1.0)::numeric(3,1),
            4 + (random() * 5)::int,
            100 + (random() * 20)::int,
            6.0 + (random() * 1.0)::numeric(3,1),
            CASE WHEN random() > 0.5 THEN 'okay' ELSE 'good' END,
            60 + (random() * 20)::int
        );
    END LOOP;

    -- Upgrade challenger: All 30 days completed (high performer)
    FOR day_num IN 1..30 LOOP
        INSERT INTO challenge_progress (visitor_id, user_id, day_number, logged_date, steps, water_liters, floors_climbed, protein_grams, sleep_hours, feeling, points_earned)
        VALUES (
            challenger_upgrade_id::text,
            challenger_upgrade_id,
            day_num,
            CURRENT_DATE - (32 - day_num),
            10000 + (random() * 5000)::int,
            3.0 + (random() * 0.5)::numeric(3,1),
            10 + (random() * 15)::int,
            150 + (random() * 30)::int,
            8.0 + (random() * 0.5)::numeric(3,1),
            'great',
            95 + (random() * 5)::int
        );
    END LOOP;

    RAISE NOTICE 'Created challenge progress for challengers';

    -- =============================================
    -- SUMMARY
    -- =============================================

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Comprehensive seed completed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - 8 meal types';
    RAISE NOTICE '  - 9 medical conditions';
    RAISE NOTICE '  - 12 supplements';
    RAISE NOTICE '  - 37 exercises';
    RAISE NOTICE '  - 12 lifestyle activity types';
    RAISE NOTICE '  - 20 food items';
    RAISE NOTICE '  - 13 user profiles (1 admin, 7 clients, 5 challengers)';
    RAISE NOTICE '  - Check-ins for client scenarios';
    RAISE NOTICE '  - Diet plans for active clients';
    RAISE NOTICE '  - Workout plans for active clients';
    RAISE NOTICE '  - Calculator results for challengers';
    RAISE NOTICE '  - Assessment results for challengers';
    RAISE NOTICE '  - Challenge progress for challengers';
    RAISE NOTICE '';
    RAISE NOTICE 'Test Client Scenarios:';
    RAISE NOTICE '  - Alex Thompson: Active, good progress';
    RAISE NOTICE '  - Jordan Martinez: Struggling, FLAGGED';
    RAISE NOTICE '  - Sam Wilson: New, pending reviews';
    RAISE NOTICE '  - Morgan Chen: Long-term success';
    RAISE NOTICE '  - Casey Rivera: Brand new (day 1)';
    RAISE NOTICE '  - Taylor Brown: Deactivated';
    RAISE NOTICE '  - Jamie Parker: Has medical conditions';
    RAISE NOTICE '';
    RAISE NOTICE 'Test Challenger Scenarios:';
    RAISE NOTICE '  - Riley Johnson: Active (day 15 of 30)';
    RAISE NOTICE '  - Avery Williams: Completed full challenge';
    RAISE NOTICE '  - Quinn Davis: Brand new (day 1)';
    RAISE NOTICE '  - Peyton Miller: Inactive (stopped at day 5)';
    RAISE NOTICE '  - Cameron Lee: Ready for client upgrade';

END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '========== VERIFICATION ==========' as info;
SELECT 'Meal Types:' as entity, COUNT(*) as count FROM meal_types;
SELECT 'Medical Conditions:' as entity, COUNT(*) as count FROM medical_conditions;
SELECT 'Supplements:' as entity, COUNT(*) as count FROM supplements;
SELECT 'Exercises:' as entity, COUNT(*) as count FROM exercises;
SELECT 'Lifestyle Activities:' as entity, COUNT(*) as count FROM lifestyle_activity_types;
SELECT 'Food Items:' as entity, COUNT(*) as count FROM food_items;
SELECT 'Profiles (Total):' as entity, COUNT(*) as count FROM profiles;
SELECT 'Profiles (Admin):' as entity, COUNT(*) as count FROM profiles WHERE role = 'admin';
SELECT 'Profiles (Client):' as entity, COUNT(*) as count FROM profiles WHERE role = 'client';
SELECT 'Profiles (Challenger):' as entity, COUNT(*) as count FROM profiles WHERE role = 'challenger';
SELECT 'Check-ins:' as entity, COUNT(*) as count FROM check_ins;
SELECT 'Diet Plans:' as entity, COUNT(*) as count FROM diet_plans;
SELECT 'Workout Plans:' as entity, COUNT(*) as count FROM workout_plans;
SELECT 'Calculator Results:' as entity, COUNT(*) as count FROM calculator_results;
SELECT 'Assessment Results:' as entity, COUNT(*) as count FROM assessment_results;
SELECT 'Challenge Progress:' as entity, COUNT(*) as count FROM challenge_progress;
