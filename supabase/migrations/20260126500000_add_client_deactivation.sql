-- Migration: Add client deactivation fields
-- Created: 2026-01-26
-- Description: Adds deactivation fields to profiles table to support
-- admin ability to temporarily disable client access

-- =============================================================================
-- ADD DEACTIVATION COLUMNS TO PROFILES TABLE
-- =============================================================================

-- Add is_deactivated flag (defaults to false - clients are active by default)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN profiles.is_deactivated IS 'Whether the client account is deactivated';

-- Add deactivated_at timestamp to track when deactivation occurred
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.deactivated_at IS 'Timestamp when the account was deactivated';

-- Add deactivation_reason to optionally store why the account was deactivated
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

COMMENT ON COLUMN profiles.deactivation_reason IS 'Optional reason for account deactivation';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Add index for deactivated status (useful for filtering active/deactivated clients)
CREATE INDEX IF NOT EXISTS idx_profiles_is_deactivated ON profiles(is_deactivated);

-- Composite index for common admin query: active clients
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON profiles(role, is_deactivated)
WHERE role = 'client';

-- =============================================================================
-- NOTE ON RLS POLICIES
-- =============================================================================

-- Deactivation is enforced at the APPLICATION layer (middleware, auth callback,
-- login provider), NOT in RLS policies. This avoids recursive subquery issues
-- that can occur when RLS policies query the same table they're protecting.
--
-- The middleware checks is_deactivated and blocks access before any data queries.
-- This is more reliable and performant than RLS-based enforcement.
