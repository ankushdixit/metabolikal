-- Migration: Add display_order to diet_plans
-- Created: 2026-01-27
-- Description: Adds display_order column to diet_plans for consistent ordering
--              within grouped meals (like workout_plans, supplement_plans, and
--              lifestyle_activity_plans already have).

-- Add display_order column to diet_plans
ALTER TABLE diet_plans
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

COMMENT ON COLUMN diet_plans.display_order IS 'Order of food items within a meal group for consistent display';

-- Create an index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_diet_plans_display_order
  ON diet_plans(client_id, day_number, meal_category, display_order);
