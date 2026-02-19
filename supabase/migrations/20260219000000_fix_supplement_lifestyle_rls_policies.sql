-- Migration: Fix RLS policies for supplement/lifestyle/library tables
-- Created: 2026-02-19
-- Description: Updates 5 tables from the 20260127 migration that still use the old
--   inline EXISTS(SELECT 1 FROM profiles ...) pattern instead of the is_admin()
--   SECURITY DEFINER function. This prevents potential RLS recursion issues and
--   keeps all admin policies consistent.

-- =============================================================================
-- 1. supplement_plans — Client Plan table
-- =============================================================================
DROP POLICY IF EXISTS "Admin manages supplement plans" ON supplement_plans;

CREATE POLICY "Admin manages supplement plans" ON supplement_plans
  FOR ALL USING (is_admin());

-- =============================================================================
-- 2. lifestyle_activity_plans — Client Plan table
-- =============================================================================
DROP POLICY IF EXISTS "Admin manages activity plans" ON lifestyle_activity_plans;

CREATE POLICY "Admin manages activity plans" ON lifestyle_activity_plans
  FOR ALL USING (is_admin());

-- =============================================================================
-- 3. supplements — Master Library table
-- =============================================================================
DROP POLICY IF EXISTS "Admin manages supplements" ON supplements;

CREATE POLICY "Admin manages supplements" ON supplements
  FOR ALL USING (is_admin());

-- =============================================================================
-- 4. exercises — Master Library table
-- =============================================================================
DROP POLICY IF EXISTS "Admin manages exercises" ON exercises;

CREATE POLICY "Admin manages exercises" ON exercises
  FOR ALL USING (is_admin());

-- =============================================================================
-- 5. lifestyle_activity_types — Master Library table
-- =============================================================================
DROP POLICY IF EXISTS "Admin manages activity types" ON lifestyle_activity_types;

CREATE POLICY "Admin manages activity types" ON lifestyle_activity_types
  FOR ALL USING (is_admin());
