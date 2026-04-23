-- Migration: handle_new_user persists invited_at from user_metadata
-- Created: 2026-04-23
-- Description:
--   Extends the on_auth_user_created trigger so it copies `invited_at` from
--   auth.users.raw_user_meta_data into public.profiles atomically at user
--   creation time. This removes the race between `admin.inviteUserByEmail()`
--   (which creates the user AND sends the email) and a subsequent
--   `profiles.update({invited_at})` in the invite-client route — a window
--   during which a fast-clicked invite link could land in /auth/callback/client
--   with invited_at still null and be mis-routed to /dashboard.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, invited_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'client',
    CASE
      WHEN NEW.raw_user_meta_data ? 'invited_at'
        THEN (NEW.raw_user_meta_data->>'invited_at')::timestamptz
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
