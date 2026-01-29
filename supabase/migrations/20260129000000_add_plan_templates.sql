-- Migration: Plan Templates - Reusable single-day plan templates for admin
-- Created: 2026-01-29
-- Description: Creates plan_templates table and template item tables for diet, supplements, workouts, and lifestyle activities.
--              Templates can be created by admin and applied to any client's plan day.

-- =============================================================================
-- PLAN TEMPLATES TABLE
-- =============================================================================

-- Main templates table
CREATE TABLE plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

COMMENT ON TABLE plan_templates IS 'Reusable single-day plan templates that can be applied to any client plan day';
COMMENT ON COLUMN plan_templates.name IS 'Template name (e.g., "Rest Day", "High Protein Day")';
COMMENT ON COLUMN plan_templates.category IS 'Template category (weight_loss, maintenance, muscle_gain, reset, rest_day, training_day, general)';
COMMENT ON COLUMN plan_templates.created_by IS 'Admin who created the template';

-- Indexes for plan_templates
CREATE INDEX idx_plan_templates_category ON plan_templates(category);
CREATE INDEX idx_plan_templates_is_active ON plan_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_plan_templates_name ON plan_templates(name);

-- Trigger for updated_at
CREATE TRIGGER update_plan_templates_updated_at
  BEFORE UPDATE ON plan_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TEMPLATE DIET ITEMS TABLE
-- =============================================================================

-- Template diet items (mirrors diet_plans structure)
CREATE TABLE template_diet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES plan_templates(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  meal_category VARCHAR(50),
  serving_multiplier DECIMAL(4,2) DEFAULT 1.0,
  time_type time_type DEFAULT 'period',
  time_start TIME,
  time_end TIME,
  time_period time_period,
  relative_anchor relative_anchor,
  relative_offset_minutes INTEGER,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE template_diet_items IS 'Diet items within a plan template';
COMMENT ON COLUMN template_diet_items.meal_category IS 'Meal category (pre-workout, post-workout, breakfast, lunch, evening-snack, dinner)';
COMMENT ON COLUMN template_diet_items.serving_multiplier IS 'Multiplier for the serving size';

-- Indexes for template_diet_items
CREATE INDEX idx_template_diet_items_template ON template_diet_items(template_id);
CREATE INDEX idx_template_diet_items_food ON template_diet_items(food_item_id);

-- Trigger for updated_at
CREATE TRIGGER update_template_diet_items_updated_at
  BEFORE UPDATE ON template_diet_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TEMPLATE SUPPLEMENT ITEMS TABLE
-- =============================================================================

-- Template supplement items
CREATE TABLE template_supplement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES plan_templates(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  dosage DECIMAL(10,2),
  time_type time_type DEFAULT 'relative',
  time_start TIME,
  time_end TIME,
  time_period time_period,
  relative_anchor relative_anchor,
  relative_offset_minutes INTEGER,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE template_supplement_items IS 'Supplement items within a plan template';
COMMENT ON COLUMN template_supplement_items.dosage IS 'Dosage amount (overrides supplement default)';

-- Indexes for template_supplement_items
CREATE INDEX idx_template_supplement_items_template ON template_supplement_items(template_id);
CREATE INDEX idx_template_supplement_items_supplement ON template_supplement_items(supplement_id);

-- Trigger for updated_at
CREATE TRIGGER update_template_supplement_items_updated_at
  BEFORE UPDATE ON template_supplement_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TEMPLATE WORKOUT ITEMS TABLE
-- =============================================================================

-- Template workout items
CREATE TABLE template_workout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES plan_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255),
  section VARCHAR(50) DEFAULT 'main' CHECK (section IN ('warmup', 'main', 'cooldown')),
  sets INTEGER,
  reps INTEGER,
  duration_minutes INTEGER,
  scheduled_duration_minutes INTEGER,
  rest_seconds INTEGER,
  time_type time_type DEFAULT 'period',
  time_start TIME,
  time_end TIME,
  time_period time_period,
  relative_anchor relative_anchor,
  relative_offset_minutes INTEGER,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE template_workout_items IS 'Workout items within a plan template';
COMMENT ON COLUMN template_workout_items.exercise_name IS 'Exercise name (overrides exercise library name if provided)';
COMMENT ON COLUMN template_workout_items.section IS 'Workout section: warmup, main, or cooldown';
COMMENT ON COLUMN template_workout_items.scheduled_duration_minutes IS 'Expected duration of this workout session';

-- Indexes for template_workout_items
CREATE INDEX idx_template_workout_items_template ON template_workout_items(template_id);
CREATE INDEX idx_template_workout_items_exercise ON template_workout_items(exercise_id);

-- Trigger for updated_at
CREATE TRIGGER update_template_workout_items_updated_at
  BEFORE UPDATE ON template_workout_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TEMPLATE LIFESTYLE ITEMS TABLE
-- =============================================================================

-- Template lifestyle items
CREATE TABLE template_lifestyle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES plan_templates(id) ON DELETE CASCADE,
  lifestyle_activity_type_id UUID NOT NULL REFERENCES lifestyle_activity_types(id) ON DELETE CASCADE,
  target_value DECIMAL(10,2),
  time_type time_type DEFAULT 'all_day',
  time_start TIME,
  time_end TIME,
  time_period time_period,
  relative_anchor relative_anchor,
  relative_offset_minutes INTEGER,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE template_lifestyle_items IS 'Lifestyle activity items within a plan template';
COMMENT ON COLUMN template_lifestyle_items.target_value IS 'Target value (overrides activity type default)';

-- Indexes for template_lifestyle_items
CREATE INDEX idx_template_lifestyle_items_template ON template_lifestyle_items(template_id);
CREATE INDEX idx_template_lifestyle_items_activity ON template_lifestyle_items(lifestyle_activity_type_id);

-- Trigger for updated_at
CREATE TRIGGER update_template_lifestyle_items_updated_at
  BEFORE UPDATE ON template_lifestyle_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all template tables
ALTER TABLE plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_diet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_supplement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_workout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_lifestyle_items ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies: plan_templates
-- Admin can manage all, no client access (templates are admin-only)
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can manage templates" ON plan_templates
  FOR ALL USING (is_admin());

-- -----------------------------------------------------------------------------
-- RLS Policies: template_diet_items
-- Admin can manage all
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can manage template diet items" ON template_diet_items
  FOR ALL USING (is_admin());

-- -----------------------------------------------------------------------------
-- RLS Policies: template_supplement_items
-- Admin can manage all
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can manage template supplement items" ON template_supplement_items
  FOR ALL USING (is_admin());

-- -----------------------------------------------------------------------------
-- RLS Policies: template_workout_items
-- Admin can manage all
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can manage template workout items" ON template_workout_items
  FOR ALL USING (is_admin());

-- -----------------------------------------------------------------------------
-- RLS Policies: template_lifestyle_items
-- Admin can manage all
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can manage template lifestyle items" ON template_lifestyle_items
  FOR ALL USING (is_admin());
