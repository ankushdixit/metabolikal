-- Migration: Add invitation tracking fields to profiles
-- Created: 2026-01-26
-- Description: Adds columns to track invitation status for admin-invited clients

-- =============================================================================
-- ADD INVITATION TRACKING COLUMNS
-- =============================================================================

-- Add invited_at column - set when admin invites a user
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.invited_at IS 'Timestamp when user was invited by admin (null if self-registered)';

-- Add invitation_accepted_at column - set when invited user first logs in
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.invitation_accepted_at IS 'Timestamp when invited user accepted and completed signup';

-- =============================================================================
-- INDEX FOR PENDING INVITES QUERY
-- =============================================================================

-- Index for efficiently querying pending invites
CREATE INDEX IF NOT EXISTS idx_profiles_pending_invites
ON profiles(invited_at)
WHERE invited_at IS NOT NULL AND invitation_accepted_at IS NULL;
