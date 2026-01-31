-- Migration: Add quantity-based input fields for diet plans
-- Replaces serving_multiplier UI with intuitive quantity-based input
-- The multiplier is still stored but calculated from: quantity_grams / reference_quantity

-- Add quantity fields to diet_plans
ALTER TABLE diet_plans
ADD COLUMN quantity_grams DECIMAL(7,2) DEFAULT NULL,
ADD COLUMN quantity_type VARCHAR(10) DEFAULT NULL
  CHECK (quantity_type IN ('raw', 'cooked')),
ADD COLUMN quantity_note VARCHAR(100) DEFAULT NULL;

-- Add quantity fields to template_diet_items
ALTER TABLE template_diet_items
ADD COLUMN quantity_grams DECIMAL(7,2) DEFAULT NULL,
ADD COLUMN quantity_type VARCHAR(10) DEFAULT NULL
  CHECK (quantity_type IN ('raw', 'cooked')),
ADD COLUMN quantity_note VARCHAR(100) DEFAULT NULL;

-- Add quantity fields to food_logs for consistency
ALTER TABLE food_logs
ADD COLUMN quantity_grams DECIMAL(7,2) DEFAULT NULL,
ADD COLUMN quantity_type VARCHAR(10) DEFAULT NULL
  CHECK (quantity_type IN ('raw', 'cooked')),
ADD COLUMN quantity_note VARCHAR(100) DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN diet_plans.quantity_grams IS 'User-entered quantity in grams';
COMMENT ON COLUMN diet_plans.quantity_type IS 'Whether quantity refers to raw or cooked weight';
COMMENT ON COLUMN diet_plans.quantity_note IS 'Optional note describing serving (e.g., "2 chapatis")';

COMMENT ON COLUMN template_diet_items.quantity_grams IS 'User-entered quantity in grams';
COMMENT ON COLUMN template_diet_items.quantity_type IS 'Whether quantity refers to raw or cooked weight';
COMMENT ON COLUMN template_diet_items.quantity_note IS 'Optional note describing serving (e.g., "2 chapatis")';

COMMENT ON COLUMN food_logs.quantity_grams IS 'User-entered quantity in grams';
COMMENT ON COLUMN food_logs.quantity_type IS 'Whether quantity refers to raw or cooked weight';
COMMENT ON COLUMN food_logs.quantity_note IS 'Optional note describing serving (e.g., "2 chapatis")';
