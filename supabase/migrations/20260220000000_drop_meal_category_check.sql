-- Drop the hardcoded CHECK constraint on diet_plans.meal_category
-- so that any meal type slug from the meal_types table is accepted.
ALTER TABLE diet_plans DROP CONSTRAINT IF EXISTS diet_plans_meal_category_check;
