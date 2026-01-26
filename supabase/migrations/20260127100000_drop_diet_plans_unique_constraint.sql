-- Migration: Drop UNIQUE constraint on diet_plans
-- Created: 2026-01-27
-- Description: Removes the UNIQUE constraint on (client_id, day_number, meal_category)
--              to allow multiple food items per meal category per day.
--              This aligns diet_plans behavior with workout_plans which allows
--              multiple exercises at the same time.

-- Drop the unique constraint
-- The constraint was created inline in the table definition, so it has an auto-generated name.
-- We need to find and drop it by looking for unique constraints on these columns.

-- First, let's drop any indexes that might enforce uniqueness
DROP INDEX IF EXISTS diet_plans_client_id_day_number_meal_category_key;

-- Drop the constraint (PostgreSQL auto-names inline constraints)
ALTER TABLE diet_plans
  DROP CONSTRAINT IF EXISTS diet_plans_client_id_day_number_meal_category_key;

-- Add a comment explaining the change
COMMENT ON TABLE diet_plans IS 'Personalized diet plans per client. Multiple food items allowed per meal category per day.';

-- Create an index for performance (non-unique) since we still query by these columns
CREATE INDEX IF NOT EXISTS idx_diet_plans_client_day_meal
  ON diet_plans(client_id, day_number, meal_category);
