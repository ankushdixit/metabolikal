-- Migration: Add Plan Completions Table
-- Description: Track completion of plan items (meals, supplements, workouts, lifestyle activities)
-- for the client timeline dashboard

-- =============================================================================
-- PLAN COMPLETIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS plan_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('diet', 'supplement', 'workout', 'lifestyle')),
  plan_item_id UUID NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one completion per item per day per client
  UNIQUE(client_id, plan_type, plan_item_id, completed_date)
);

-- Add comment for documentation
COMMENT ON TABLE plan_completions IS 'Tracks client completion of daily plan items across all plan types';
COMMENT ON COLUMN plan_completions.plan_type IS 'Type of plan item: diet, supplement, workout, or lifestyle';
COMMENT ON COLUMN plan_completions.plan_item_id IS 'UUID of the source plan item (diet_plans.id, supplement_plans.id, etc.)';
COMMENT ON COLUMN plan_completions.completed_date IS 'The date for which the item was marked complete (not when it was marked)';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary lookup: client + date for dashboard display
CREATE INDEX IF NOT EXISTS idx_plan_completions_client_date
ON plan_completions(client_id, completed_date);

-- Type filtering within a date
CREATE INDEX IF NOT EXISTS idx_plan_completions_client_date_type
ON plan_completions(client_id, completed_date, plan_type);

-- For checking specific item completion
CREATE INDEX IF NOT EXISTS idx_plan_completions_item
ON plan_completions(plan_item_id, completed_date);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE plan_completions ENABLE ROW LEVEL SECURITY;

-- Clients can view their own completions
CREATE POLICY "Clients can view own completions"
ON plan_completions FOR SELECT TO authenticated
USING (client_id = auth.uid());

-- Clients can insert their own completions
CREATE POLICY "Clients can insert own completions"
ON plan_completions FOR INSERT TO authenticated
WITH CHECK (client_id = auth.uid());

-- Clients can delete their own completions (to un-complete)
CREATE POLICY "Clients can delete own completions"
ON plan_completions FOR DELETE TO authenticated
USING (client_id = auth.uid());

-- Admins can view all completions
CREATE POLICY "Admins can view all completions"
ON plan_completions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can manage all completions
CREATE POLICY "Admins can manage all completions"
ON plan_completions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
