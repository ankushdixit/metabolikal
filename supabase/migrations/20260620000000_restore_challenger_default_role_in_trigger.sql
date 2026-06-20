-- Migration: Restore challenger default role in handle_new_user trigger
-- Created: 2026-06-20
-- Description:
--   Fixes a regression introduced by 20260423000000_handle_new_user_persists_invited_at.sql.
--   That migration extended handle_new_user() to persist `invited_at` from
--   user_metadata (closing an invite-link race), but in the rewrite it replaced
--   the role default with a hardcoded `'client'`. Since self-registration
--   (app/(auth)/register/page.tsx) never sends a `role` in user_metadata, every
--   self-signed-up challenger has been created with role='client' since
--   2026-04-23 — so they surface in the admin Clients list as "Active" instead
--   of under Challengers.
--
--   This restores the challenger-aware default that 20260128000000 and
--   20260207000000 used (`COALESCE(... ->>'role', 'challenger')`) while KEEPING
--   the invited_at persistence added in 20260423000000. It also restores the
--   `unique_violation` guard that the same regression dropped.
--
--   Safe for admin-invited clients: app/api/admin/invite-client/route.ts:120
--   explicitly sets role='client' on the profile after the trigger runs, and the
--   /auth/callback routing branches on `invited_at` (not `role`), so the brief
--   window where an invited profile reads role='challenger' has no effect.
--
--   Note: existing mis-stamped rows (role='client', invited_at IS NULL,
--   plan_start_date IS NULL) are corrected separately/manually and are not
--   touched here to avoid a blanket UPDATE catching legitimate clients.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, invited_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'challenger'),  -- default self-signups to challenger; admin invite overrides to client
    CASE
      WHEN NEW.raw_user_meta_data ? 'invited_at'
        THEN (NEW.raw_user_meta_data->>'invited_at')::timestamptz
      ELSE NULL
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists (e.g., created via seed), just return
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile when a new user signs up. Defaults role to challenger (overridable via user_metadata.role) and persists invited_at from user_metadata atomically.';
