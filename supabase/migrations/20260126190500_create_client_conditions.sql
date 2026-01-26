-- Migration: Create client_conditions table
-- Description: Links clients to their medical conditions for food compatibility warnings
-- Author: System
-- Date: 2026-01-26

-- Create client_conditions table
CREATE TABLE IF NOT EXISTS client_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES medical_conditions(id) ON DELETE CASCADE,
  diagnosed_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  CONSTRAINT unique_client_condition UNIQUE(client_id, condition_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_client_conditions_client
  ON client_conditions(client_id);

CREATE INDEX IF NOT EXISTS idx_client_conditions_condition
  ON client_conditions(condition_id);

-- Add RLS policies
ALTER TABLE client_conditions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all client conditions"
  ON client_conditions
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

-- Policy: Clients can view their own conditions
CREATE POLICY "Clients can view their own conditions"
  ON client_conditions
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE client_conditions IS 'Links clients to medical conditions for food compatibility warnings and condition display';
COMMENT ON COLUMN client_conditions.client_id IS 'Reference to the client (profiles table)';
COMMENT ON COLUMN client_conditions.condition_id IS 'Reference to the medical condition';
COMMENT ON COLUMN client_conditions.diagnosed_at IS 'Optional date when the condition was diagnosed';
COMMENT ON COLUMN client_conditions.notes IS 'Additional notes about the condition for this client';
COMMENT ON COLUMN client_conditions.created_by IS 'Admin who added this condition';
