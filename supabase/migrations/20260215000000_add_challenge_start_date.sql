-- Add challenge_start_date to profiles
-- When a challenger is upgraded to a client, this preserves their original
-- challenge start date so the gamification hook can calculate an extended
-- totalDays that includes both the challenger period and the new client plan.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS challenge_start_date DATE;
