-- Migration: Fix RLS Infinite Recursion
-- Created: 2026-01-20
-- Description: Fixes infinite recursion in RLS policies by using SECURITY DEFINER function

-- =============================================================================
-- CREATE SECURITY DEFINER FUNCTION TO CHECK ADMIN STATUS
-- =============================================================================

-- This function bypasses RLS, preventing infinite recursion when checking admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin() IS 'Checks if current user is admin. Uses SECURITY DEFINER to bypass RLS and prevent recursion.';

-- =============================================================================
-- DROP OLD POLICIES THAT CAUSE RECURSION
-- =============================================================================

-- profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- food_items policies
DROP POLICY IF EXISTS "Admins can manage food items" ON food_items;

-- diet_plans policies
DROP POLICY IF EXISTS "Admins can view all diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Admins can manage diet plans" ON diet_plans;

-- food_alternatives policies
DROP POLICY IF EXISTS "Admins can manage food alternatives" ON food_alternatives;

-- workout_plans policies
DROP POLICY IF EXISTS "Admins can view all workout plans" ON workout_plans;
DROP POLICY IF EXISTS "Admins can manage workout plans" ON workout_plans;

-- food_logs policies
DROP POLICY IF EXISTS "Admins can view all food logs" ON food_logs;

-- workout_logs policies
DROP POLICY IF EXISTS "Admins can view all workout logs" ON workout_logs;

-- check_ins policies
DROP POLICY IF EXISTS "Admins can view all check-ins" ON check_ins;
DROP POLICY IF EXISTS "Admins can update check-ins" ON check_ins;

-- challenge_progress policies
DROP POLICY IF EXISTS "Admins can view all challenge progress" ON challenge_progress;

-- assessment_results policies
DROP POLICY IF EXISTS "Admins can view all assessment results" ON assessment_results;

-- =============================================================================
-- RECREATE POLICIES USING is_admin() FUNCTION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- food_items policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can manage food items" ON food_items
  FOR ALL USING (is_admin());

-- -----------------------------------------------------------------------------
-- diet_plans policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view all diet plans" ON diet_plans
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage diet plans" ON diet_plans
  FOR ALL USING (is_admin());

-- -----------------------------------------------------------------------------
-- food_alternatives policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can manage food alternatives" ON food_alternatives
  FOR ALL USING (is_admin());

-- -----------------------------------------------------------------------------
-- workout_plans policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view all workout plans" ON workout_plans
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage workout plans" ON workout_plans
  FOR ALL USING (is_admin());

-- -----------------------------------------------------------------------------
-- food_logs policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view all food logs" ON food_logs
  FOR SELECT USING (is_admin());

-- -----------------------------------------------------------------------------
-- workout_logs policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view all workout logs" ON workout_logs
  FOR SELECT USING (is_admin());

-- -----------------------------------------------------------------------------
-- check_ins policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view all check-ins" ON check_ins
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update check-ins" ON check_ins
  FOR UPDATE USING (is_admin());

-- -----------------------------------------------------------------------------
-- challenge_progress policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view all challenge progress" ON challenge_progress
  FOR SELECT USING (is_admin());

-- -----------------------------------------------------------------------------
-- assessment_results policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view all assessment results" ON assessment_results
  FOR SELECT USING (is_admin());

-- =============================================================================
-- ALSO ALLOW CLIENTS TO UPDATE THEIR OWN DIET PLANS (for swapping alternatives)
-- =============================================================================
CREATE POLICY "Clients can update own diet plans" ON diet_plans
  FOR UPDATE USING (auth.uid() = client_id);
