-- Migration: Add Challenger Role and Calculator Results Table
-- Created: 2026-01-21
-- Description: Introduces the "challenger" role for 30-day challenge participants and creates
--              the calculator_results table for persisting metabolic calculator data

-- =============================================================================
-- 1. UPDATE ROLE CONSTRAINT TO INCLUDE 'challenger'
-- =============================================================================

-- Drop existing role check constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with 'challenger' role
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'client', 'challenger'));

-- Update default role to 'challenger' for new registrations
ALTER TABLE profiles
ALTER COLUMN role SET DEFAULT 'challenger';

-- Add comment to explain the role
COMMENT ON COLUMN profiles.role IS 'User role: admin, client, or challenger (default for new registrations)';

-- =============================================================================
-- 2. CREATE CALCULATOR_RESULTS TABLE
-- =============================================================================

CREATE TABLE calculator_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Input metrics
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
  weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0),
  height_cm DECIMAL(5,2) NOT NULL CHECK (height_cm > 0),
  body_fat_percent DECIMAL(4,1) CHECK (body_fat_percent >= 0 AND body_fat_percent <= 100),
  activity_level TEXT NOT NULL,
  goal TEXT NOT NULL CHECK (goal IN ('fat_loss', 'maintain', 'muscle_gain')),
  goal_weight_kg DECIMAL(5,2) CHECK (goal_weight_kg > 0),
  medical_conditions TEXT[],

  -- Calculated results
  bmr DECIMAL(7,2) NOT NULL,
  tdee DECIMAL(7,2) NOT NULL,
  target_calories DECIMAL(7,2) NOT NULL,
  protein_grams DECIMAL(6,2) NOT NULL,
  carbs_grams DECIMAL(6,2) NOT NULL,
  fats_grams DECIMAL(6,2) NOT NULL,
  metabolic_impact_percent DECIMAL(4,1),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One result per user (updated on recalculation)
  UNIQUE(user_id)
);

COMMENT ON TABLE calculator_results IS 'Persisted metabolic calculator results for authenticated users';

-- =============================================================================
-- 3. CREATE INDEXES
-- =============================================================================

CREATE INDEX idx_calculator_results_user ON calculator_results(user_id);

-- =============================================================================
-- 4. ENABLE RLS AND CREATE POLICIES FOR calculator_results
-- =============================================================================

ALTER TABLE calculator_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own calculator results
CREATE POLICY "Users can view own calculator results"
  ON calculator_results FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own calculator results
CREATE POLICY "Users can insert own calculator results"
  ON calculator_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own calculator results
CREATE POLICY "Users can update own calculator results"
  ON calculator_results FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all calculator results
CREATE POLICY "Admins can view all calculator results"
  ON calculator_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- =============================================================================
-- 5. ADD UPDATED_AT TRIGGER
-- =============================================================================

CREATE TRIGGER update_calculator_results_updated_at
  BEFORE UPDATE ON calculator_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. UPDATE CHALLENGE_PROGRESS CONSTRAINTS
-- =============================================================================

-- Add unique constraint for authenticated user + day (if not exists)
-- This allows the same day_number for different users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'challenge_progress_user_day_unique'
  ) THEN
    ALTER TABLE challenge_progress
    ADD CONSTRAINT challenge_progress_user_day_unique
    UNIQUE (user_id, day_number);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 7. CREATE ADDITIONAL RLS POLICY FOR ADMIN ROLE UPDATES
-- =============================================================================

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;

-- Admins can update user roles (specifically for upgrading challengers to clients)
CREATE POLICY "Admins can update user roles"
  ON profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
