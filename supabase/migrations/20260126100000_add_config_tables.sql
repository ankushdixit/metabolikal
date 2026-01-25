-- Migration: Add configuration tables for meal types and medical conditions
-- Created: 2026-01-26
-- Description: Creates meal_types and medical_conditions tables for dynamic admin configuration

-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: meal_types
-- Description: Configurable meal type options for food items and diet plans
-- -----------------------------------------------------------------------------
CREATE TABLE meal_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE meal_types IS 'Configurable meal type categories for food items and diet plans';
COMMENT ON COLUMN meal_types.slug IS 'URL-friendly identifier, must be unique';
COMMENT ON COLUMN meal_types.display_order IS 'Order in which meal types appear in UI';
COMMENT ON COLUMN meal_types.is_active IS 'Soft delete flag - inactive types are hidden from selection';

-- -----------------------------------------------------------------------------
-- Table: medical_conditions
-- Description: Configurable medical conditions with metabolic impact percentages
-- -----------------------------------------------------------------------------
CREATE TABLE medical_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  impact_percent INTEGER NOT NULL DEFAULT 0 CHECK (impact_percent >= 0 AND impact_percent <= 100),
  gender_restriction VARCHAR(10) CHECK (gender_restriction IN ('male', 'female') OR gender_restriction IS NULL),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE medical_conditions IS 'Configurable medical conditions that affect metabolic calculations';
COMMENT ON COLUMN medical_conditions.slug IS 'URL-friendly identifier, must be unique';
COMMENT ON COLUMN medical_conditions.impact_percent IS 'Percentage reduction to TDEE calculation (0-100)';
COMMENT ON COLUMN medical_conditions.gender_restriction IS 'Restrict condition to specific gender (null = all genders)';
COMMENT ON COLUMN medical_conditions.is_active IS 'Soft delete flag - inactive conditions are hidden from selection';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- meal_types indexes
CREATE INDEX idx_meal_types_active_order ON meal_types(display_order) WHERE is_active = true;
CREATE INDEX idx_meal_types_slug ON meal_types(slug);

-- medical_conditions indexes
CREATE INDEX idx_medical_conditions_active_order ON medical_conditions(display_order) WHERE is_active = true;
CREATE INDEX idx_medical_conditions_slug ON medical_conditions(slug);
CREATE INDEX idx_medical_conditions_gender ON medical_conditions(gender_restriction) WHERE is_active = true;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on both tables
ALTER TABLE meal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_conditions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies: meal_types
-- -----------------------------------------------------------------------------

-- Anyone can read active meal types (for public calculator and food forms)
CREATE POLICY "Anyone can read active meal types" ON meal_types
  FOR SELECT USING (is_active = true);

-- Admins can read all meal types (including inactive)
CREATE POLICY "Admins can read all meal types" ON meal_types
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert meal types
CREATE POLICY "Admins can insert meal types" ON meal_types
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update meal types
CREATE POLICY "Admins can update meal types" ON meal_types
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete meal types
CREATE POLICY "Admins can delete meal types" ON meal_types
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: medical_conditions
-- -----------------------------------------------------------------------------

-- Anyone can read active medical conditions (for public calculator)
CREATE POLICY "Anyone can read active medical conditions" ON medical_conditions
  FOR SELECT USING (is_active = true);

-- Admins can read all medical conditions (including inactive)
CREATE POLICY "Admins can read all medical conditions" ON medical_conditions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert medical conditions
CREATE POLICY "Admins can insert medical conditions" ON medical_conditions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update medical conditions
CREATE POLICY "Admins can update medical conditions" ON medical_conditions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete medical conditions
CREATE POLICY "Admins can delete medical conditions" ON medical_conditions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- TRIGGERS FOR updated_at
-- =============================================================================

CREATE TRIGGER update_meal_types_updated_at
  BEFORE UPDATE ON meal_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_conditions_updated_at
  BEFORE UPDATE ON medical_conditions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Seed meal types (matching existing hardcoded values plus additional options)
INSERT INTO meal_types (name, slug, display_order) VALUES
  ('Pre-Workout', 'pre-workout', 1),
  ('Breakfast', 'breakfast', 2),
  ('Mid-Morning Snack', 'mid-morning-snack', 3),
  ('Lunch', 'lunch', 4),
  ('Evening Snack', 'evening-snack', 5),
  ('Post-Workout', 'post-workout', 6),
  ('Dinner', 'dinner', 7),
  ('Snack', 'snack', 8);

-- Seed medical conditions (matching existing hardcoded values from use-calculator.ts)
INSERT INTO medical_conditions (name, slug, impact_percent, gender_restriction, display_order) VALUES
  ('Hypothyroidism', 'hypothyroidism', 8, NULL, 1),
  ('PCOS', 'pcos', 10, 'female', 2),
  ('Type 2 Diabetes', 'type2-diabetes', 12, NULL, 3),
  ('Insulin Resistance', 'insulin-resistance', 10, NULL, 4),
  ('Sleep Apnea', 'sleep-apnea', 7, NULL, 5),
  ('Metabolic Syndrome', 'metabolic-syndrome', 15, NULL, 6),
  ('Thyroid Medication Managed', 'thyroid-managed', 3, NULL, 7),
  ('Chronic Fatigue Syndrome', 'chronic-fatigue', 8, NULL, 8),
  ('None of the above', 'none', 0, NULL, 100);
