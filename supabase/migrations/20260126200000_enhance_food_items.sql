-- Migration: Enhance food items with quantities, conditions, and alternatives
-- Created: 2026-01-26
-- Description: Adds raw/cooked quantities to food_items and creates junction tables
--              for food-condition restrictions and food-food alternatives

-- =============================================================================
-- ALTER TABLE: food_items - Add quantity columns
-- =============================================================================

-- Add raw and cooked quantity columns
ALTER TABLE food_items
ADD COLUMN raw_quantity VARCHAR(50),
ADD COLUMN cooked_quantity VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN food_items.raw_quantity IS 'Raw/uncooked quantity (e.g., 100g raw)';
COMMENT ON COLUMN food_items.cooked_quantity IS 'Cooked quantity (e.g., 75g cooked)';

-- =============================================================================
-- TABLE: food_item_conditions (Avoid For)
-- Description: Foods to avoid for certain medical conditions
-- =============================================================================

CREATE TABLE food_item_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES medical_conditions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(food_item_id, condition_id)
);

COMMENT ON TABLE food_item_conditions IS 'Junction table linking food items to medical conditions they should be avoided for';
COMMENT ON COLUMN food_item_conditions.food_item_id IS 'Reference to the food item';
COMMENT ON COLUMN food_item_conditions.condition_id IS 'Reference to the medical condition this food should be avoided for';

-- Indexes for efficient lookups
CREATE INDEX idx_food_item_conditions_food ON food_item_conditions(food_item_id);
CREATE INDEX idx_food_item_conditions_condition ON food_item_conditions(condition_id);

-- Enable RLS
ALTER TABLE food_item_conditions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read food item conditions" ON food_item_conditions
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert food item conditions" ON food_item_conditions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can update food item conditions" ON food_item_conditions
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can delete food item conditions" ON food_item_conditions
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- =============================================================================
-- TABLE: food_item_alternatives (Food-to-Food)
-- Description: Food item alternatives (food A can be substituted with food B)
-- =============================================================================

CREATE TABLE food_item_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  alternative_food_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(food_item_id, alternative_food_id),
  CHECK (food_item_id != alternative_food_id)
);

COMMENT ON TABLE food_item_alternatives IS 'Junction table defining substitutable food items at the database level';
COMMENT ON COLUMN food_item_alternatives.food_item_id IS 'The primary food item';
COMMENT ON COLUMN food_item_alternatives.alternative_food_id IS 'A food item that can substitute for the primary';
COMMENT ON COLUMN food_item_alternatives.display_order IS 'Order in which alternatives should be displayed';

-- Indexes for efficient lookups
CREATE INDEX idx_food_item_alternatives_food ON food_item_alternatives(food_item_id);
CREATE INDEX idx_food_item_alternatives_alt ON food_item_alternatives(alternative_food_id);

-- Enable RLS
ALTER TABLE food_item_alternatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read food alternatives" ON food_item_alternatives
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert food alternatives" ON food_item_alternatives
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can update food alternatives" ON food_item_alternatives
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can delete food alternatives" ON food_item_alternatives
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
