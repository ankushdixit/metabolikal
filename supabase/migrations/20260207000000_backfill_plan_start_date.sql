-- Migration: Backfill plan_start_date and fix trigger
-- Created: 2026-02-07
-- Description:
--   1. Backfills NULL plan_start_date from created_at::date
--   2. Updates handle_new_user() trigger to always set plan_start_date
--   3. Fixes corrupted day_number in challenge_progress

-- =============================================================================
-- 1. BACKFILL existing NULL plan_start_date
--    Use the earliest logged_date from challenge_progress if it predates
--    created_at (handles seed/test data). Otherwise fall back to created_at.
-- =============================================================================
UPDATE public.profiles p
SET plan_start_date = COALESCE(
  (SELECT MIN(cp.logged_date)
   FROM public.challenge_progress cp
   WHERE cp.user_id = p.id
     AND cp.logged_date < p.created_at::date),
  p.created_at::date
)
WHERE p.plan_start_date IS NULL;

-- =============================================================================
-- 2. UPDATE TRIGGER to include plan_start_date = CURRENT_DATE
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, plan_start_date)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'challenger'),
    CURRENT_DATE
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists (e.g., created via seed), just return
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile record when a new user signs up. Uses challenger as default role and sets plan_start_date to today.';

-- =============================================================================
-- 3. FIX corrupted day_number in challenge_progress
--    First delete corrupt rows whose corrected day_number would collide
--    with an existing row, then update the remaining corrupt rows.
-- =============================================================================

-- 3a. Delete corrupt rows that would cause duplicate key violations
DELETE FROM public.challenge_progress cp
USING public.profiles p
WHERE cp.user_id = p.id
  AND p.plan_start_date IS NOT NULL
  AND cp.day_number != (cp.logged_date - p.plan_start_date)::int + 1
  AND (cp.logged_date - p.plan_start_date)::int + 1 >= 1
  AND EXISTS (
    SELECT 1 FROM public.challenge_progress cp2
    WHERE cp2.visitor_id = cp.visitor_id
      AND cp2.day_number = (cp.logged_date - p.plan_start_date)::int + 1
      AND cp2.id != cp.id
  );

-- 3b. Update remaining corrupt rows
UPDATE public.challenge_progress cp
SET day_number = (cp.logged_date - p.plan_start_date)::int + 1
FROM public.profiles p
WHERE cp.user_id = p.id
  AND p.plan_start_date IS NOT NULL
  AND cp.day_number != (cp.logged_date - p.plan_start_date)::int + 1
  AND (cp.logged_date - p.plan_start_date)::int + 1 >= 1;
