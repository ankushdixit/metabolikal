-- Migration: Timeline Schema and Master Libraries Foundation
-- Created: 2026-01-27
-- Description: Creates timeline scheduling infrastructure with master libraries for supplements,
--              exercises, and lifestyle activities, plus plan assignment tables with timing support.

-- =============================================================================
-- ENUMS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Scheduling Enums
-- -----------------------------------------------------------------------------

-- Time type: how the schedule is specified
CREATE TYPE time_type AS ENUM (
  'fixed',      -- Specific time (e.g., 8:00 AM)
  'relative',   -- Relative to an anchor event (e.g., 30 min after wake_up)
  'period',     -- Within a time period (e.g., morning)
  'all_day'     -- No specific time, track throughout the day
);

COMMENT ON TYPE time_type IS 'How timeline item timing is specified';

-- Time periods for period-based scheduling
CREATE TYPE time_period AS ENUM (
  'early_morning',  -- 5:00 - 7:00
  'morning',        -- 7:00 - 10:00
  'midday',         -- 10:00 - 14:00
  'afternoon',      -- 14:00 - 17:00
  'evening',        -- 17:00 - 20:00
  'night',          -- 20:00 - 22:00
  'before_sleep'    -- 22:00 - 23:59
);

COMMENT ON TYPE time_period IS 'Time periods for scheduling items throughout the day';

-- Relative anchors for relative timing
CREATE TYPE relative_anchor AS ENUM (
  'wake_up',        -- Client's wake up time
  'pre_workout',    -- Before scheduled workout
  'post_workout',   -- After scheduled workout
  'breakfast',      -- Breakfast meal time
  'lunch',          -- Lunch meal time
  'evening_snack',  -- Evening snack time
  'dinner',         -- Dinner meal time
  'sleep'           -- Client's bedtime
);

COMMENT ON TYPE relative_anchor IS 'Anchor events for relative time scheduling';

-- -----------------------------------------------------------------------------
-- Category Enums
-- -----------------------------------------------------------------------------

-- Supplement categories
CREATE TYPE supplement_category AS ENUM (
  'vitamin',       -- Vitamins (A, B, C, D, E, K, etc.)
  'mineral',       -- Minerals (Zinc, Magnesium, Iron, etc.)
  'protein',       -- Protein supplements (Whey, Casein, etc.)
  'amino_acid',    -- Individual amino acids (BCAAs, Glutamine, etc.)
  'fatty_acid',    -- Omega-3, Fish oil, etc.
  'herbal',        -- Herbal supplements (Ashwagandha, etc.)
  'probiotic',     -- Probiotics and digestive aids
  'other'          -- Other supplements
);

COMMENT ON TYPE supplement_category IS 'Categories for supplement classification';

-- Exercise categories
CREATE TYPE exercise_category AS ENUM (
  'strength',      -- Resistance training exercises
  'cardio',        -- Cardiovascular exercises
  'flexibility',   -- Stretching and mobility
  'balance',       -- Balance and stability exercises
  'hiit',          -- High-intensity interval training
  'warmup',        -- Warm-up exercises
  'cooldown',      -- Cool-down exercises
  'other'          -- Other exercises
);

COMMENT ON TYPE exercise_category IS 'Categories for exercise classification';

-- Muscle groups for exercises
CREATE TYPE muscle_group AS ENUM (
  'chest',         -- Chest muscles
  'back',          -- Back muscles
  'shoulders',     -- Shoulder muscles
  'biceps',        -- Bicep muscles
  'triceps',       -- Tricep muscles
  'forearms',      -- Forearm muscles
  'core',          -- Core/abdominal muscles
  'quadriceps',    -- Quadricep muscles
  'hamstrings',    -- Hamstring muscles
  'glutes',        -- Gluteal muscles
  'calves',        -- Calf muscles
  'full_body',     -- Full body exercises
  'other'          -- Other muscle groups
);

COMMENT ON TYPE muscle_group IS 'Muscle groups targeted by exercises';

-- Lifestyle activity categories
CREATE TYPE lifestyle_activity_category AS ENUM (
  'movement',      -- Steps, walking, general movement
  'mindfulness',   -- Meditation, breathing, journaling
  'sleep',         -- Sleep-related activities
  'hydration',     -- Water intake tracking
  'sunlight',      -- Sunlight exposure
  'social',        -- Social activities
  'recovery',      -- Rest, relaxation, recovery
  'other'          -- Other lifestyle activities
);

COMMENT ON TYPE lifestyle_activity_category IS 'Categories for lifestyle activity classification';

-- =============================================================================
-- MASTER LIBRARY TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: supplements
-- Description: Master library of supplement definitions
-- -----------------------------------------------------------------------------
CREATE TABLE supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category supplement_category NOT NULL DEFAULT 'other',
  default_dosage DECIMAL(10,2) NOT NULL DEFAULT 1,
  dosage_unit VARCHAR(50) NOT NULL DEFAULT 'capsule',
  instructions TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE supplements IS 'Master library of supplement definitions for reuse across clients';
COMMENT ON COLUMN supplements.default_dosage IS 'Default dosage amount for this supplement';
COMMENT ON COLUMN supplements.dosage_unit IS 'Unit of measurement (capsule, tablet, mg, ml, scoop, etc.)';
COMMENT ON COLUMN supplements.instructions IS 'How to take this supplement (with food, on empty stomach, etc.)';

-- Indexes for supplements
CREATE INDEX idx_supplements_name ON supplements(name);
CREATE INDEX idx_supplements_category ON supplements(category);
CREATE INDEX idx_supplements_active ON supplements(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_supplements_updated_at
  BEFORE UPDATE ON supplements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Table: exercises
-- Description: Master library of exercise definitions
-- -----------------------------------------------------------------------------
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category exercise_category NOT NULL DEFAULT 'strength',
  muscle_group muscle_group NOT NULL DEFAULT 'full_body',
  equipment VARCHAR(100),  -- 'barbell', 'dumbbell', 'bodyweight', 'machine', 'cable', etc.

  -- Default values (can be overridden in workout_plans)
  default_sets INTEGER DEFAULT 3,
  default_reps INTEGER DEFAULT 10,
  default_duration_seconds INTEGER,  -- For timed exercises (planks, cardio)
  rest_seconds INTEGER DEFAULT 60,

  instructions TEXT,
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),

  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE exercises IS 'Master library of exercise definitions for reuse across clients';
COMMENT ON COLUMN exercises.equipment IS 'Equipment required (barbell, dumbbell, bodyweight, machine, cable, etc.)';
COMMENT ON COLUMN exercises.default_sets IS 'Default number of sets (can be overridden per client)';
COMMENT ON COLUMN exercises.default_reps IS 'Default number of reps (can be overridden per client)';
COMMENT ON COLUMN exercises.default_duration_seconds IS 'Default duration for timed exercises (planks, cardio)';
COMMENT ON COLUMN exercises.difficulty_level IS 'Exercise difficulty from 1 (beginner) to 5 (advanced)';

-- Indexes for exercises
CREATE INDEX idx_exercises_name ON exercises(name);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_exercises_active ON exercises(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Table: lifestyle_activity_types
-- Description: Master library of lifestyle activity type definitions
-- -----------------------------------------------------------------------------
CREATE TABLE lifestyle_activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category lifestyle_activity_category NOT NULL DEFAULT 'other',

  -- Default values
  default_target_value DECIMAL(10,2),
  target_unit VARCHAR(50),  -- 'steps', 'minutes', 'glasses', 'hours', 'liters', etc.

  description TEXT,
  rationale TEXT,  -- Why this activity is beneficial
  icon VARCHAR(50),  -- Icon name for UI (e.g., 'sun', 'footprints', 'book', 'water')

  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE lifestyle_activity_types IS 'Master library of lifestyle activity types for reuse across clients';
COMMENT ON COLUMN lifestyle_activity_types.default_target_value IS 'Default target value (can be overridden per client)';
COMMENT ON COLUMN lifestyle_activity_types.target_unit IS 'Unit for the target (steps, minutes, glasses, hours, liters, etc.)';
COMMENT ON COLUMN lifestyle_activity_types.rationale IS 'Explanation of why this activity is beneficial';
COMMENT ON COLUMN lifestyle_activity_types.icon IS 'Icon identifier for UI display';

-- Indexes for lifestyle_activity_types
CREATE INDEX idx_lifestyle_activity_types_name ON lifestyle_activity_types(name);
CREATE INDEX idx_lifestyle_activity_types_category ON lifestyle_activity_types(category);
CREATE INDEX idx_lifestyle_activity_types_active ON lifestyle_activity_types(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_lifestyle_activity_types_updated_at
  BEFORE UPDATE ON lifestyle_activity_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PLAN TABLES (Client Assignments)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: supplement_plans
-- Description: Client-specific supplement schedules with timing
-- -----------------------------------------------------------------------------
CREATE TABLE supplement_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  day_number INTEGER CHECK (day_number >= 1 AND day_number <= 7),
  dosage DECIMAL(10,2) NOT NULL DEFAULT 1,

  -- Timeline scheduling
  time_type time_type NOT NULL DEFAULT 'relative',
  time_start TIME,
  time_end TIME,
  time_period time_period,
  relative_anchor relative_anchor,
  relative_offset_minutes INTEGER DEFAULT 0,

  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE supplement_plans IS 'Client-specific supplement schedules linking clients to supplements with timing';
COMMENT ON COLUMN supplement_plans.day_number IS 'Day of week (1=Monday to 7=Sunday), NULL for daily';
COMMENT ON COLUMN supplement_plans.dosage IS 'Dosage for this plan (overrides supplement default)';
COMMENT ON COLUMN supplement_plans.time_type IS 'How timing is specified (fixed, relative, period, all_day)';
COMMENT ON COLUMN supplement_plans.time_start IS 'Fixed start time (when time_type=fixed)';
COMMENT ON COLUMN supplement_plans.time_end IS 'Fixed end time (when time_type=fixed)';
COMMENT ON COLUMN supplement_plans.time_period IS 'Time period (when time_type=period)';
COMMENT ON COLUMN supplement_plans.relative_anchor IS 'Anchor event (when time_type=relative)';
COMMENT ON COLUMN supplement_plans.relative_offset_minutes IS 'Offset from anchor in minutes (positive=after, negative=before)';

-- Indexes for supplement_plans
CREATE INDEX idx_supplement_plans_client ON supplement_plans(client_id);
CREATE INDEX idx_supplement_plans_day ON supplement_plans(client_id, day_number);
CREATE INDEX idx_supplement_plans_supplement ON supplement_plans(supplement_id);

-- Trigger for updated_at
CREATE TRIGGER update_supplement_plans_updated_at
  BEFORE UPDATE ON supplement_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Table: lifestyle_activity_plans
-- Description: Client-specific lifestyle activity schedules with timing
-- -----------------------------------------------------------------------------
CREATE TABLE lifestyle_activity_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type_id UUID NOT NULL REFERENCES lifestyle_activity_types(id) ON DELETE CASCADE,
  day_number INTEGER CHECK (day_number >= 1 AND day_number <= 7),

  -- Override defaults from activity type
  target_value DECIMAL(10,2),
  custom_rationale TEXT,  -- Optional client-specific rationale

  -- Timeline scheduling
  time_type time_type NOT NULL DEFAULT 'all_day',
  time_start TIME,
  time_end TIME,
  time_period time_period,
  relative_anchor relative_anchor,
  relative_offset_minutes INTEGER DEFAULT 0,

  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE lifestyle_activity_plans IS 'Client-specific lifestyle activity schedules linking clients to activity types';
COMMENT ON COLUMN lifestyle_activity_plans.day_number IS 'Day of week (1=Monday to 7=Sunday), NULL for daily';
COMMENT ON COLUMN lifestyle_activity_plans.target_value IS 'Target value (overrides activity type default)';
COMMENT ON COLUMN lifestyle_activity_plans.custom_rationale IS 'Client-specific rationale for this activity';

-- Indexes for lifestyle_activity_plans
CREATE INDEX idx_lifestyle_activity_plans_client ON lifestyle_activity_plans(client_id);
CREATE INDEX idx_lifestyle_activity_plans_day ON lifestyle_activity_plans(client_id, day_number);
CREATE INDEX idx_lifestyle_activity_plans_activity ON lifestyle_activity_plans(activity_type_id);

-- Trigger for updated_at
CREATE TRIGGER update_lifestyle_activity_plans_updated_at
  BEFORE UPDATE ON lifestyle_activity_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ALTER EXISTING TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Alter: workout_plans
-- Description: Add exercise library reference and timeline scheduling fields
-- -----------------------------------------------------------------------------
ALTER TABLE workout_plans
  ADD COLUMN exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  ADD COLUMN time_type time_type DEFAULT 'period',
  ADD COLUMN time_start TIME,
  ADD COLUMN time_end TIME,
  ADD COLUMN time_period time_period,
  ADD COLUMN relative_anchor relative_anchor,
  ADD COLUMN relative_offset_minutes INTEGER DEFAULT 0,
  ADD COLUMN scheduled_duration_minutes INTEGER DEFAULT 60;

COMMENT ON COLUMN workout_plans.exercise_id IS 'Reference to master exercise library (optional, for library-based exercises)';
COMMENT ON COLUMN workout_plans.time_type IS 'How timing is specified for this workout';
COMMENT ON COLUMN workout_plans.scheduled_duration_minutes IS 'Expected duration of this workout session';

-- Note: Existing fields (exercise_name, sets, reps) remain for backward compatibility
-- and to allow overriding exercise library defaults

-- Add index for exercise_id
CREATE INDEX idx_workout_plans_exercise ON workout_plans(exercise_id);

-- -----------------------------------------------------------------------------
-- Alter: diet_plans
-- Description: Add timeline scheduling fields
-- -----------------------------------------------------------------------------
ALTER TABLE diet_plans
  ADD COLUMN time_type time_type DEFAULT 'period',
  ADD COLUMN time_start TIME,
  ADD COLUMN time_end TIME,
  ADD COLUMN time_period time_period,
  ADD COLUMN relative_anchor relative_anchor,
  ADD COLUMN relative_offset_minutes INTEGER DEFAULT 0;

COMMENT ON COLUMN diet_plans.time_type IS 'How timing is specified for this meal';
COMMENT ON COLUMN diet_plans.time_period IS 'Time period for this meal (migrated from meal_category)';

-- Migrate existing meal_category to time_period
-- Pre-workout meals are typically early morning
UPDATE diet_plans SET time_period = 'early_morning' WHERE meal_category = 'pre-workout' AND time_period IS NULL;
-- Breakfast is typically morning
UPDATE diet_plans SET time_period = 'morning' WHERE meal_category = 'breakfast' AND time_period IS NULL;
-- Lunch is typically midday
UPDATE diet_plans SET time_period = 'midday' WHERE meal_category = 'lunch' AND time_period IS NULL;
-- Evening snack and post-workout are typically afternoon
UPDATE diet_plans SET time_period = 'afternoon' WHERE meal_category IN ('evening-snack', 'post-workout') AND time_period IS NULL;
-- Dinner is typically evening
UPDATE diet_plans SET time_period = 'evening' WHERE meal_category = 'dinner' AND time_period IS NULL;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RLS: supplements (Master Library)
-- Admin can manage, all authenticated can view active
-- -----------------------------------------------------------------------------
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages supplements" ON supplements
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "All view active supplements" ON supplements
  FOR SELECT TO authenticated
  USING (is_active = true);

-- -----------------------------------------------------------------------------
-- RLS: exercises (Master Library)
-- Admin can manage, all authenticated can view active
-- -----------------------------------------------------------------------------
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages exercises" ON exercises
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "All view active exercises" ON exercises
  FOR SELECT TO authenticated
  USING (is_active = true);

-- -----------------------------------------------------------------------------
-- RLS: lifestyle_activity_types (Master Library)
-- Admin can manage, all authenticated can view active
-- -----------------------------------------------------------------------------
ALTER TABLE lifestyle_activity_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages activity types" ON lifestyle_activity_types
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "All view active activity types" ON lifestyle_activity_types
  FOR SELECT TO authenticated
  USING (is_active = true);

-- -----------------------------------------------------------------------------
-- RLS: supplement_plans (Client Plans)
-- Admin can manage all, clients can view their own
-- -----------------------------------------------------------------------------
ALTER TABLE supplement_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages supplement plans" ON supplement_plans
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Clients view own supplement plans" ON supplement_plans
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- -----------------------------------------------------------------------------
-- RLS: lifestyle_activity_plans (Client Plans)
-- Admin can manage all, clients can view their own
-- -----------------------------------------------------------------------------
ALTER TABLE lifestyle_activity_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages activity plans" ON lifestyle_activity_plans
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Clients view own activity plans" ON lifestyle_activity_plans
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- =============================================================================
-- SEED DATA: Initial Master Library Items
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Seed: Common Supplements
-- -----------------------------------------------------------------------------
INSERT INTO supplements (name, category, default_dosage, dosage_unit, instructions, notes, display_order) VALUES
  ('Fish Oil', 'fatty_acid', 2, 'capsule', 'Take with food for better absorption', 'Omega-3 fatty acids for heart and brain health', 1),
  ('Vitamin D3', 'vitamin', 2000, 'IU', 'Take with a meal containing fats', 'Essential for bone health and immune function', 2),
  ('Multivitamin', 'vitamin', 1, 'tablet', 'Take with breakfast', 'Daily essential vitamins and minerals', 3),
  ('Magnesium', 'mineral', 400, 'mg', 'Take before bed for better sleep', 'Supports muscle and nerve function', 4),
  ('Zinc', 'mineral', 15, 'mg', 'Take with food to avoid stomach upset', 'Supports immune function and wound healing', 5),
  ('Vitamin B Complex', 'vitamin', 1, 'capsule', 'Take with breakfast', 'Supports energy metabolism', 6),
  ('Whey Protein', 'protein', 1, 'scoop', 'Mix with water or milk', '25g protein per serving for muscle recovery', 7),
  ('Creatine Monohydrate', 'amino_acid', 5, 'g', 'Take daily, timing not critical', 'Supports strength and muscle performance', 8),
  ('BCAAs', 'amino_acid', 1, 'scoop', 'Take during or after workout', 'Branch chain amino acids for muscle recovery', 9),
  ('Ashwagandha', 'herbal', 300, 'mg', 'Take in evening', 'Adaptogen for stress management', 10),
  ('Probiotic', 'probiotic', 1, 'capsule', 'Take on empty stomach', 'Supports gut health and digestion', 11),
  ('Vitamin C', 'vitamin', 1000, 'mg', 'Take with meals', 'Antioxidant and immune support', 12);

-- -----------------------------------------------------------------------------
-- Seed: Common Exercises
-- -----------------------------------------------------------------------------
INSERT INTO exercises (name, category, muscle_group, equipment, default_sets, default_reps, default_duration_seconds, rest_seconds, difficulty_level, display_order) VALUES
  -- Chest
  ('Bench Press', 'strength', 'chest', 'barbell', 4, 8, NULL, 90, 3, 1),
  ('Incline Dumbbell Press', 'strength', 'chest', 'dumbbell', 3, 10, NULL, 60, 2, 2),
  ('Push-ups', 'strength', 'chest', 'bodyweight', 3, 15, NULL, 45, 1, 3),
  ('Cable Flyes', 'strength', 'chest', 'cable', 3, 12, NULL, 60, 2, 4),

  -- Back
  ('Deadlift', 'strength', 'back', 'barbell', 4, 6, NULL, 120, 4, 5),
  ('Bent Over Row', 'strength', 'back', 'barbell', 4, 8, NULL, 90, 3, 6),
  ('Lat Pulldown', 'strength', 'back', 'cable', 3, 10, NULL, 60, 2, 7),
  ('Pull-ups', 'strength', 'back', 'bodyweight', 3, 8, NULL, 90, 3, 8),

  -- Shoulders
  ('Overhead Press', 'strength', 'shoulders', 'barbell', 4, 8, NULL, 90, 3, 9),
  ('Lateral Raises', 'strength', 'shoulders', 'dumbbell', 3, 12, NULL, 45, 2, 10),
  ('Face Pulls', 'strength', 'shoulders', 'cable', 3, 15, NULL, 45, 2, 11),

  -- Arms
  ('Barbell Curl', 'strength', 'biceps', 'barbell', 3, 10, NULL, 60, 2, 12),
  ('Tricep Pushdown', 'strength', 'triceps', 'cable', 3, 12, NULL, 45, 2, 13),
  ('Hammer Curl', 'strength', 'biceps', 'dumbbell', 3, 10, NULL, 45, 2, 14),

  -- Legs
  ('Squat', 'strength', 'quadriceps', 'barbell', 4, 8, NULL, 120, 4, 15),
  ('Romanian Deadlift', 'strength', 'hamstrings', 'barbell', 3, 10, NULL, 90, 3, 16),
  ('Leg Press', 'strength', 'quadriceps', 'machine', 3, 12, NULL, 90, 2, 17),
  ('Leg Curl', 'strength', 'hamstrings', 'machine', 3, 12, NULL, 60, 2, 18),
  ('Calf Raises', 'strength', 'calves', 'machine', 4, 15, NULL, 45, 1, 19),
  ('Hip Thrust', 'strength', 'glutes', 'barbell', 3, 12, NULL, 90, 3, 20),
  ('Lunges', 'strength', 'quadriceps', 'dumbbell', 3, 10, NULL, 60, 2, 21),

  -- Core
  ('Plank', 'strength', 'core', 'bodyweight', 3, NULL, 60, 45, 1, 22),
  ('Russian Twist', 'strength', 'core', 'bodyweight', 3, 20, NULL, 30, 2, 23),
  ('Hanging Leg Raises', 'strength', 'core', 'bodyweight', 3, 12, NULL, 60, 3, 24),
  ('Cable Crunch', 'strength', 'core', 'cable', 3, 15, NULL, 45, 2, 25),

  -- Cardio
  ('Treadmill Running', 'cardio', 'full_body', NULL, 1, NULL, 1800, 0, 2, 26),
  ('Cycling', 'cardio', 'full_body', 'machine', 1, NULL, 1800, 0, 2, 27),
  ('Rowing', 'cardio', 'full_body', 'machine', 1, NULL, 1200, 0, 3, 28),
  ('Jump Rope', 'cardio', 'full_body', NULL, 3, NULL, 180, 60, 2, 29),

  -- HIIT
  ('Burpees', 'hiit', 'full_body', 'bodyweight', 4, 10, NULL, 30, 3, 30),
  ('Mountain Climbers', 'hiit', 'core', 'bodyweight', 4, NULL, 30, 15, 2, 31),
  ('Box Jumps', 'hiit', 'quadriceps', NULL, 4, 10, NULL, 30, 3, 32),

  -- Warmup
  ('Arm Circles', 'warmup', 'shoulders', 'bodyweight', 2, 15, NULL, 0, 1, 33),
  ('Jumping Jacks', 'warmup', 'full_body', 'bodyweight', 2, 20, NULL, 0, 1, 34),
  ('Dynamic Stretching', 'warmup', 'full_body', 'bodyweight', 1, NULL, 300, 0, 1, 35),

  -- Cooldown
  ('Static Stretching', 'cooldown', 'full_body', 'bodyweight', 1, NULL, 600, 0, 1, 36),
  ('Foam Rolling', 'cooldown', 'full_body', NULL, 1, NULL, 300, 0, 1, 37);

-- -----------------------------------------------------------------------------
-- Seed: Common Lifestyle Activity Types
-- -----------------------------------------------------------------------------
INSERT INTO lifestyle_activity_types (name, category, default_target_value, target_unit, description, rationale, icon, display_order) VALUES
  ('Daily Steps', 'movement', 10000, 'steps', 'Track your daily step count', 'Walking improves cardiovascular health and helps maintain a healthy weight', 'footprints', 1),
  ('Morning Sunlight', 'sunlight', 15, 'minutes', 'Get morning sunlight exposure', 'Morning light helps regulate circadian rhythm and improves vitamin D production', 'sun', 2),
  ('Water Intake', 'hydration', 8, 'glasses', 'Track your daily water consumption', 'Proper hydration supports metabolism, energy levels, and overall health', 'droplet', 3),
  ('Sleep Duration', 'sleep', 8, 'hours', 'Track your nightly sleep', 'Quality sleep is essential for recovery, hormone regulation, and mental clarity', 'moon', 4),
  ('Meditation', 'mindfulness', 10, 'minutes', 'Daily meditation practice', 'Meditation reduces stress, improves focus, and supports emotional well-being', 'brain', 5),
  ('Journaling', 'mindfulness', 1, 'entry', 'Daily journaling session', 'Journaling promotes self-reflection, reduces stress, and improves mental clarity', 'book', 6),
  ('Deep Breathing', 'mindfulness', 5, 'minutes', 'Deep breathing exercises', 'Activates parasympathetic nervous system for stress relief', 'wind', 7),
  ('Stretching', 'recovery', 10, 'minutes', 'Daily stretching routine', 'Improves flexibility, reduces injury risk, and aids muscle recovery', 'activity', 8),
  ('Cold Exposure', 'recovery', 2, 'minutes', 'Cold shower or ice bath', 'Supports immune function, reduces inflammation, and improves mental resilience', 'snowflake', 9),
  ('Walking', 'movement', 30, 'minutes', 'Dedicated walking session', 'Low-impact exercise that improves cardiovascular health without excessive strain', 'walking', 10),
  ('Screen-Free Time', 'recovery', 60, 'minutes', 'Time away from screens', 'Reduces eye strain and improves sleep quality by limiting blue light exposure', 'eye-off', 11),
  ('Social Connection', 'social', 30, 'minutes', 'Quality time with loved ones', 'Social connections improve mental health and longevity', 'users', 12);
