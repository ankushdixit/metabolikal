-- Calculator Settings Migration
-- Creates a singleton table for admin-configurable calculator parameters
-- This makes all calculator formulas configurable through the admin portal

-- =============================================================================
-- CALCULATOR SETTINGS TABLE (SINGLETON)
-- =============================================================================

CREATE TABLE calculator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Activity Multipliers (TDEE calculation)
  activity_sedentary DECIMAL(4,3) NOT NULL DEFAULT 1.200,
  activity_lightly_active DECIMAL(4,3) NOT NULL DEFAULT 1.375,
  activity_moderately_active DECIMAL(4,3) NOT NULL DEFAULT 1.550,
  activity_very_active DECIMAL(4,3) NOT NULL DEFAULT 1.725,
  activity_extremely_active DECIMAL(4,3) NOT NULL DEFAULT 1.900,

  -- Goal Adjustments (calories relative to TDEE, per documentation)
  goal_fat_loss_adjustment INTEGER NOT NULL DEFAULT -550,
  goal_maintain_adjustment INTEGER NOT NULL DEFAULT 0,
  goal_muscle_gain_adjustment INTEGER NOT NULL DEFAULT 475,

  -- Protein Ratios (grams per kg body weight)
  protein_fat_loss DECIMAL(3,1) NOT NULL DEFAULT 2.0,
  protein_maintain DECIMAL(3,1) NOT NULL DEFAULT 1.8,
  protein_muscle_gain DECIMAL(3,1) NOT NULL DEFAULT 2.2,

  -- Health Score Weights (must sum to 100)
  health_score_lifestyle_weight INTEGER NOT NULL DEFAULT 60,
  health_score_physical_weight INTEGER NOT NULL DEFAULT 40,
  health_score_calorie_bonus INTEGER NOT NULL DEFAULT 5,
  health_score_calorie_min INTEGER NOT NULL DEFAULT 1200,
  health_score_calorie_max INTEGER NOT NULL DEFAULT 3500,

  -- Metabolic Impact Cap (per documentation: 25%)
  metabolic_impact_cap INTEGER NOT NULL DEFAULT 25,

  -- Lifestyle Multiplier (NEW - per documentation)
  -- Formula: 1 + ((lifestyleScore - 50) / divisor)
  lifestyle_multiplier_enabled BOOLEAN NOT NULL DEFAULT true,
  lifestyle_multiplier_divisor INTEGER NOT NULL DEFAULT 500,

  -- Physical Score Base (per documentation)
  physical_score_base INTEGER NOT NULL DEFAULT 75,

  -- Physical Score BMI Points
  physical_score_bmi_optimal INTEGER NOT NULL DEFAULT 15,
  physical_score_bmi_acceptable INTEGER NOT NULL DEFAULT 10,
  physical_score_bmi_outside INTEGER NOT NULL DEFAULT 5,

  -- Physical Score Body Fat Points
  physical_score_bodyfat_optimal INTEGER NOT NULL DEFAULT 10,
  physical_score_bodyfat_acceptable INTEGER NOT NULL DEFAULT 7,
  physical_score_bodyfat_outside INTEGER NOT NULL DEFAULT 3,

  -- BMI Range Definitions
  bmi_optimal_min DECIMAL(4,2) NOT NULL DEFAULT 18.50,
  bmi_optimal_max DECIMAL(4,2) NOT NULL DEFAULT 24.90,
  bmi_acceptable_min DECIMAL(4,2) NOT NULL DEFAULT 17.00,
  bmi_acceptable_max DECIMAL(4,2) NOT NULL DEFAULT 29.90,

  -- Body Fat Range Definitions - Male
  bodyfat_male_optimal_min INTEGER NOT NULL DEFAULT 10,
  bodyfat_male_optimal_max INTEGER NOT NULL DEFAULT 20,
  bodyfat_male_acceptable_min INTEGER NOT NULL DEFAULT 8,
  bodyfat_male_acceptable_max INTEGER NOT NULL DEFAULT 24,

  -- Body Fat Range Definitions - Female
  bodyfat_female_optimal_min INTEGER NOT NULL DEFAULT 18,
  bodyfat_female_optimal_max INTEGER NOT NULL DEFAULT 28,
  bodyfat_female_acceptable_min INTEGER NOT NULL DEFAULT 15,
  bodyfat_female_acceptable_max INTEGER NOT NULL DEFAULT 32,

  -- Health Score Tiers (JSON array)
  health_score_tiers JSONB NOT NULL DEFAULT '[
    {"name": "Elite Metabolic Health", "description": "Outstanding foundation with peak performance potential", "minScore": 86, "maxScore": 100},
    {"name": "Good Metabolic Health", "description": "Solid foundation with room for optimization", "minScore": 71, "maxScore": 85},
    {"name": "Moderate Metabolic Health", "description": "Functional baseline with clear improvement opportunities", "minScore": 51, "maxScore": 70},
    {"name": "Needs Attention", "description": "Significant optimization potential to unlock your metabolism", "minScore": 0, "maxScore": 50}
  ]'::jsonb,

  -- Audit fields
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create singleton constraint (only one row allowed)
CREATE UNIQUE INDEX idx_calculator_settings_singleton ON calculator_settings ((true));

-- Insert default row
INSERT INTO calculator_settings DEFAULT VALUES;

-- Updated timestamp trigger
CREATE TRIGGER set_calculator_settings_updated_at
  BEFORE UPDATE ON calculator_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE calculator_settings ENABLE ROW LEVEL SECURITY;

-- Public read access (calculator needs to read settings without auth)
CREATE POLICY "calculator_settings_public_read"
  ON calculator_settings
  FOR SELECT
  TO public
  USING (true);

-- Admin-only write access
CREATE POLICY "calculator_settings_admin_update"
  ON calculator_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- No insert/delete allowed (singleton pattern)
-- The only row is created by the migration

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE calculator_settings IS 'Singleton table for admin-configurable calculator parameters';
COMMENT ON COLUMN calculator_settings.activity_sedentary IS 'TDEE multiplier for sedentary activity level';
COMMENT ON COLUMN calculator_settings.goal_fat_loss_adjustment IS 'Calorie adjustment for fat loss goal (negative = deficit)';
COMMENT ON COLUMN calculator_settings.metabolic_impact_cap IS 'Maximum combined metabolic impact percentage from medical conditions';
COMMENT ON COLUMN calculator_settings.lifestyle_multiplier_enabled IS 'Whether to apply lifestyle score as TDEE multiplier';
COMMENT ON COLUMN calculator_settings.lifestyle_multiplier_divisor IS 'Divisor for lifestyle multiplier formula: 1 + ((score-50)/divisor)';
COMMENT ON COLUMN calculator_settings.physical_score_base IS 'Base physical score before BMI/body fat adjustments';
COMMENT ON COLUMN calculator_settings.health_score_tiers IS 'JSON array of health score tier definitions';
