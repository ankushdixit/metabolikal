-- Migration: Add admin DELETE policy for push_subscriptions
-- The cleanup code in push-service.ts runs as the admin user but there was no
-- RLS policy allowing admins to delete stale/expired subscriptions, so every
-- cleanup attempt silently failed and old subscriptions accumulated forever.

CREATE POLICY "Admins can delete all subscriptions"
  ON push_subscriptions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
