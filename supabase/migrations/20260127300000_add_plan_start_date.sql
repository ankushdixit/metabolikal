-- Migration: Add plan_start_date and plan_duration_days to profiles
-- Description: Allows connecting Day 1 to an actual calendar date and
--              supporting plans longer than 7 days.

-- Add plan_start_date to profiles (when client's Day 1 begins)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_start_date DATE;

-- Add plan_duration_days to profiles (how many days in their plan)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_duration_days INTEGER DEFAULT 7
  CHECK (plan_duration_days >= 1 AND plan_duration_days <= 365);

COMMENT ON COLUMN profiles.plan_start_date IS 'The calendar date that corresponds to Day 1 of the client plan';
COMMENT ON COLUMN profiles.plan_duration_days IS 'Number of days in the client plan (default 7, max 365)';

-- Remove the day_number <= 7 constraint from supplement_plans
-- First drop the existing constraint, then add new one without upper limit
ALTER TABLE supplement_plans
  DROP CONSTRAINT IF EXISTS supplement_plans_day_number_check;

ALTER TABLE supplement_plans
  ADD CONSTRAINT supplement_plans_day_number_check
  CHECK (day_number >= 1);

-- Remove the day_number <= 7 constraint from lifestyle_activity_plans
ALTER TABLE lifestyle_activity_plans
  DROP CONSTRAINT IF EXISTS lifestyle_activity_plans_day_number_check;

ALTER TABLE lifestyle_activity_plans
  ADD CONSTRAINT lifestyle_activity_plans_day_number_check
  CHECK (day_number >= 1);

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_plan_start_date
  ON profiles(plan_start_date) WHERE plan_start_date IS NOT NULL;
