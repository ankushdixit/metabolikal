-- Migration: Create client_plan_limits table
-- Description: Date-range based macro limits for client diet plans with non-overlapping constraint
-- Author: System
-- Date: 2026-01-26

-- Enable btree_gist extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create client_plan_limits table
CREATE TABLE IF NOT EXISTS client_plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Required fields
  max_calories_per_day INTEGER NOT NULL CHECK (max_calories_per_day > 0),
  min_protein_per_day INTEGER NOT NULL CHECK (min_protein_per_day > 0),

  -- Optional macro limits
  max_protein_per_day INTEGER CHECK (
    max_protein_per_day IS NULL OR
    max_protein_per_day >= min_protein_per_day
  ),
  min_carbs_per_day INTEGER CHECK (
    min_carbs_per_day IS NULL OR
    min_carbs_per_day >= 0
  ),
  max_carbs_per_day INTEGER CHECK (
    max_carbs_per_day IS NULL OR
    max_carbs_per_day >= COALESCE(min_carbs_per_day, 0)
  ),
  min_fats_per_day INTEGER CHECK (
    min_fats_per_day IS NULL OR
    min_fats_per_day >= 0
  ),
  max_fats_per_day INTEGER CHECK (
    max_fats_per_day IS NULL OR
    max_fats_per_day >= COALESCE(min_fats_per_day, 0)
  ),

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),

  -- Ensure end_date is not before start_date
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),

  -- Prevent overlapping date ranges for the same client
  CONSTRAINT no_overlapping_ranges EXCLUDE USING gist (
    client_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  )
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_client_plan_limits_client
  ON client_plan_limits(client_id);

CREATE INDEX IF NOT EXISTS idx_client_plan_limits_dates
  ON client_plan_limits(client_id, start_date, end_date);

-- Add RLS policies
ALTER TABLE client_plan_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all client plan limits"
  ON client_plan_limits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Clients can view their own plan limits
CREATE POLICY "Clients can view their own plan limits"
  ON client_plan_limits
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE client_plan_limits IS 'Date-range based calorie and macro limits for client diet plans';
COMMENT ON COLUMN client_plan_limits.client_id IS 'Reference to the client (profiles table)';
COMMENT ON COLUMN client_plan_limits.start_date IS 'Start date of this limit period (inclusive)';
COMMENT ON COLUMN client_plan_limits.end_date IS 'End date of this limit period (inclusive)';
COMMENT ON COLUMN client_plan_limits.max_calories_per_day IS 'Maximum calories allowed per day (required)';
COMMENT ON COLUMN client_plan_limits.min_protein_per_day IS 'Minimum protein grams required per day (required)';
COMMENT ON COLUMN client_plan_limits.max_protein_per_day IS 'Optional maximum protein grams per day';
COMMENT ON COLUMN client_plan_limits.min_carbs_per_day IS 'Optional minimum carbs grams per day';
COMMENT ON COLUMN client_plan_limits.max_carbs_per_day IS 'Optional maximum carbs grams per day';
COMMENT ON COLUMN client_plan_limits.min_fats_per_day IS 'Optional minimum fats grams per day';
COMMENT ON COLUMN client_plan_limits.max_fats_per_day IS 'Optional maximum fats grams per day';
COMMENT ON COLUMN client_plan_limits.notes IS 'Additional notes about this limit period (e.g., cutting phase, bulking phase)';
COMMENT ON COLUMN client_plan_limits.created_by IS 'Admin who created this limit period';
COMMENT ON CONSTRAINT no_overlapping_ranges ON client_plan_limits IS 'Prevents overlapping date ranges for the same client using PostgreSQL exclusion constraint';
