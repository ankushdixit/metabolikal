-- Performance indexes for common query patterns (Phase 3, Task 3.9)
-- These cover the most frequently queried paths identified in the stability audit.

-- Challenge progress: filtered by user_id, (user_id + plan_cycle), and logged_date
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_cycle ON challenge_progress(user_id, plan_cycle);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_logged_date ON challenge_progress(logged_date);

-- Check-ins: filtered by client_id, and sorted/filtered by reviewed_at
CREATE INDEX IF NOT EXISTS idx_check_ins_client_id ON check_ins(client_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_reviewed_at ON check_ins(reviewed_at);

-- Plan tables: always filtered by (client_id, day_number)
CREATE INDEX IF NOT EXISTS idx_diet_plans_client_day ON diet_plans(client_id, day_number);
CREATE INDEX IF NOT EXISTS idx_workout_plans_client_day ON workout_plans(client_id, day_number);
CREATE INDEX IF NOT EXISTS idx_supplement_plans_client_day ON supplement_plans(client_id, day_number);
CREATE INDEX IF NOT EXISTS idx_lifestyle_plans_client_day ON lifestyle_activity_plans(client_id, day_number);
