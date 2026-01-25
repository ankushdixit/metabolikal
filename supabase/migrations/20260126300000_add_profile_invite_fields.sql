-- Migration: Add profile fields for client invite functionality
-- Created: 2026-01-26
-- Description: Adds date_of_birth, gender, and address columns to profiles table
-- to support admin client creation workflow

-- =============================================================================
-- ADD COLUMNS TO PROFILES TABLE
-- =============================================================================

-- Add date_of_birth column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN profiles.date_of_birth IS 'Client date of birth for age calculation';

-- Add gender column with extended options
-- Note: This is separate from calculator gender (male/female) and includes
-- additional options for profile information
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

COMMENT ON COLUMN profiles.gender IS 'Client gender for health tracking context';

-- Add address column for contact purposes
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN profiles.address IS 'Client address for contact purposes';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Add index for date of birth (useful for age-based queries)
CREATE INDEX IF NOT EXISTS idx_profiles_date_of_birth ON profiles(date_of_birth);
