-- Relax challenge_progress.day_number constraint to support durations > 30 days
-- Clients with longer plan_duration_days need day_number values beyond 30
ALTER TABLE challenge_progress
  DROP CONSTRAINT IF EXISTS challenge_progress_day_number_check;
ALTER TABLE challenge_progress
  ADD CONSTRAINT challenge_progress_day_number_check CHECK (day_number >= 1);
