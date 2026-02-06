-- =============================================================================
-- Plan Cycling Migration
-- =============================================================================
-- Adds plan_cycles table and plan_cycle column to data tables so clients
-- can be reactivated with a fresh plan cycle while preserving historical data.
-- All changes are additive (ADD COLUMN with DEFAULT) — safe for zero-downtime.
-- =============================================================================

-- 1. Create plan_cycles table
CREATE TABLE IF NOT EXISTS plan_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL CHECK (cycle_number >= 1),
  start_date DATE NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days >= 1 AND duration_days <= 365),
  end_date DATE GENERATED ALWAYS AS ((start_date + (duration_days - 1) * INTERVAL '1 day')::DATE) STORED,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, cycle_number)
);

-- Indexes for plan_cycles
CREATE INDEX idx_plan_cycles_client ON plan_cycles(client_id);
CREATE INDEX idx_plan_cycles_client_status ON plan_cycles(client_id, status);

-- 2. Add current_plan_cycle to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_plan_cycle INTEGER NOT NULL DEFAULT 1;

-- 3. Add plan_cycle to data tables
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS plan_cycle INTEGER NOT NULL DEFAULT 1;
ALTER TABLE plan_completions ADD COLUMN IF NOT EXISTS plan_cycle INTEGER NOT NULL DEFAULT 1;
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS plan_cycle INTEGER NOT NULL DEFAULT 1;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS plan_cycle INTEGER NOT NULL DEFAULT 1;

-- 4. Drop old unique constraints on challenge_progress and recreate with plan_cycle
-- visitor_id + day_number unique constraint
ALTER TABLE challenge_progress DROP CONSTRAINT IF EXISTS challenge_progress_visitor_id_day_number_key;
ALTER TABLE challenge_progress ADD CONSTRAINT challenge_progress_visitor_day_cycle_unique
  UNIQUE(visitor_id, day_number, plan_cycle);

-- user_id + day_number unique constraint
ALTER TABLE challenge_progress DROP CONSTRAINT IF EXISTS challenge_progress_user_day_unique;
ALTER TABLE challenge_progress ADD CONSTRAINT challenge_progress_user_day_cycle_unique
  UNIQUE(user_id, day_number, plan_cycle);

-- plan_completions unique constraint
ALTER TABLE plan_completions DROP CONSTRAINT IF EXISTS plan_completions_client_id_plan_type_plan_item_id_completed_key;
ALTER TABLE plan_completions DROP CONSTRAINT IF EXISTS plan_completions_client_id_plan_type_plan_item_id_complet_key;
ALTER TABLE plan_completions ADD CONSTRAINT plan_completions_client_type_item_date_cycle_unique
  UNIQUE(client_id, plan_type, plan_item_id, completed_date, plan_cycle);

-- 5. Add indexes on plan_cycle columns
CREATE INDEX idx_challenge_progress_plan_cycle ON challenge_progress(plan_cycle);
CREATE INDEX idx_plan_completions_plan_cycle ON plan_completions(plan_cycle);
CREATE INDEX idx_food_logs_plan_cycle ON food_logs(plan_cycle);
CREATE INDEX idx_check_ins_plan_cycle ON check_ins(plan_cycle);

-- 6. Backfill: insert cycle 1 row into plan_cycles for every existing client
INSERT INTO plan_cycles (client_id, cycle_number, start_date, duration_days, status)
SELECT
  p.id,
  1,
  COALESCE(p.plan_start_date, p.created_at::date),
  COALESCE(p.plan_duration_days, 7),
  CASE
    WHEN p.is_deactivated THEN 'completed'
    ELSE 'active'
  END
FROM profiles p
WHERE p.role = 'client'
  AND p.plan_start_date IS NOT NULL
ON CONFLICT (client_id, cycle_number) DO NOTHING;

-- =============================================================================
-- RLS Policies for plan_cycles
-- =============================================================================
ALTER TABLE plan_cycles ENABLE ROW LEVEL SECURITY;

-- Clients can read their own cycles
CREATE POLICY "Clients can view own plan cycles"
  ON plan_cycles FOR SELECT
  USING (client_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can manage all plan cycles"
  ON plan_cycles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
