-- Migration: Fix Profile Trigger Default Role
-- Created: 2026-01-28
-- Description: Updates the handle_new_user trigger to use 'challenger' as the default role
--              instead of 'client'. This aligns with the table default changed in
--              migration 20260121000000_add_challenger_role.sql

-- =============================================================================
-- UPDATE TRIGGER FUNCTION
-- =============================================================================

-- Replace the existing function with corrected default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'challenger')  -- Use 'challenger' as default for new signups
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists (e.g., created via seed), just return
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile record when a new user signs up. Uses challenger as default role, but can be overridden via user_metadata.role';
