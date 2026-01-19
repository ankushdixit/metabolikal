-- Migration: Initial Database Schema for METABOLI-K-AL
-- Created: 2026-01-19
-- Description: Creates all database tables with proper security through Row-Level Security (RLS) policies

-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: profiles
-- Description: User profiles linked to Supabase auth
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON COLUMN profiles.role IS 'User role: admin or client';

-- -----------------------------------------------------------------------------
-- Table: food_items
-- Description: Master food database with nutritional information
-- -----------------------------------------------------------------------------
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,1) NOT NULL,
  carbs DECIMAL(5,1),
  fats DECIMAL(5,1),
  serving_size TEXT NOT NULL,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  meal_types TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE food_items IS 'Master food database with nutritional values';
COMMENT ON COLUMN food_items.meal_types IS 'Array of meal types this food is suitable for';

-- -----------------------------------------------------------------------------
-- Table: diet_plans
-- Description: Client-specific diet plans with daily meal assignments
-- -----------------------------------------------------------------------------
CREATE TABLE diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number INTEGER CHECK (day_number >= 1),
  meal_category TEXT CHECK (meal_category IN ('pre-workout', 'post-workout', 'breakfast', 'lunch', 'evening-snack', 'dinner')),
  food_item_id UUID REFERENCES food_items(id),
  serving_multiplier DECIMAL(3,1) DEFAULT 1.0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, day_number, meal_category)
);

COMMENT ON TABLE diet_plans IS 'Personalized diet plans per client';

-- -----------------------------------------------------------------------------
-- Table: food_alternatives
-- Description: Alternative food options for diet plan items
-- -----------------------------------------------------------------------------
CREATE TABLE food_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id UUID REFERENCES diet_plans(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id),
  is_optimal BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE food_alternatives IS 'Alternative food choices for diet plan flexibility';

-- -----------------------------------------------------------------------------
-- Table: workout_plans
-- Description: Client-specific workout plans with exercises
-- -----------------------------------------------------------------------------
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number INTEGER CHECK (day_number >= 1),
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_minutes INTEGER,
  rest_seconds INTEGER DEFAULT 60,
  instructions TEXT,
  video_url TEXT,
  section TEXT CHECK (section IN ('warmup', 'main', 'cooldown')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE workout_plans IS 'Personalized workout plans per client';

-- -----------------------------------------------------------------------------
-- Table: food_logs
-- Description: Client food consumption tracking
-- -----------------------------------------------------------------------------
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  food_item_id UUID REFERENCES food_items(id),
  food_name TEXT,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,1) NOT NULL,
  serving_multiplier DECIMAL(3,1) DEFAULT 1.0,
  meal_category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE food_logs IS 'Daily food intake tracking';

-- -----------------------------------------------------------------------------
-- Table: workout_logs
-- Description: Client workout completion tracking
-- -----------------------------------------------------------------------------
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES workout_plans(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(client_id, workout_plan_id, (completed_at::DATE))
);

COMMENT ON TABLE workout_logs IS 'Workout completion tracking';

-- -----------------------------------------------------------------------------
-- Table: check_ins
-- Description: Weekly client check-ins with measurements and photos
-- -----------------------------------------------------------------------------
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  weight DECIMAL(5,1) NOT NULL,
  body_fat_percent DECIMAL(4,1),
  chest_cm DECIMAL(5,1),
  waist_cm DECIMAL(5,1),
  hips_cm DECIMAL(5,1),
  arms_cm DECIMAL(5,1),
  thighs_cm DECIMAL(5,1),
  photo_front TEXT,
  photo_side TEXT,
  photo_back TEXT,
  energy_rating INTEGER CHECK (energy_rating BETWEEN 1 AND 10),
  sleep_rating INTEGER CHECK (sleep_rating BETWEEN 1 AND 10),
  stress_rating INTEGER CHECK (stress_rating BETWEEN 1 AND 10),
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10),
  diet_adherence INTEGER CHECK (diet_adherence BETWEEN 0 AND 100),
  workout_adherence INTEGER CHECK (workout_adherence BETWEEN 0 AND 100),
  challenges TEXT,
  progress_notes TEXT,
  questions TEXT,
  admin_notes TEXT,
  flagged_for_followup BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE check_ins IS 'Weekly progress check-ins with measurements and wellness ratings';

-- -----------------------------------------------------------------------------
-- Table: challenge_progress
-- Description: 30-day challenge tracking for landing page visitors
-- -----------------------------------------------------------------------------
CREATE TABLE challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  day_number INTEGER CHECK (day_number BETWEEN 1 AND 30),
  logged_date DATE DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0,
  water_liters DECIMAL(3,1) DEFAULT 0,
  floors_climbed INTEGER DEFAULT 0,
  protein_grams INTEGER DEFAULT 0,
  sleep_hours DECIMAL(3,1) DEFAULT 0,
  feeling TEXT,
  tomorrow_focus TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visitor_id, day_number)
);

COMMENT ON TABLE challenge_progress IS '30-day challenge progress for landing page engagement';

-- -----------------------------------------------------------------------------
-- Table: assessment_results
-- Description: Metabolic assessment results from landing page
-- -----------------------------------------------------------------------------
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 10),
  body_score INTEGER CHECK (body_score BETWEEN 0 AND 10),
  nutrition_score INTEGER CHECK (nutrition_score BETWEEN 0 AND 10),
  mental_score INTEGER CHECK (mental_score BETWEEN 0 AND 10),
  stress_score INTEGER CHECK (stress_score BETWEEN 0 AND 10),
  support_score INTEGER CHECK (support_score BETWEEN 0 AND 10),
  hydration_score INTEGER CHECK (hydration_score BETWEEN 0 AND 10),
  gender TEXT CHECK (gender IN ('male', 'female')),
  age INTEGER,
  weight_kg DECIMAL(5,1),
  height_cm DECIMAL(5,1),
  body_fat_percent DECIMAL(4,1),
  activity_level TEXT,
  medical_conditions TEXT[],
  metabolic_impact_percent DECIMAL(4,1),
  goal TEXT CHECK (goal IN ('fat_loss', 'maintain', 'muscle_gain')),
  goal_weight_kg DECIMAL(5,1),
  bmr INTEGER,
  tdee INTEGER,
  target_calories INTEGER,
  health_score INTEGER,
  lifestyle_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE assessment_results IS 'Metabolic assessment results for personalized recommendations';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- diet_plans indexes
CREATE INDEX idx_diet_plans_client ON diet_plans(client_id);
CREATE INDEX idx_diet_plans_day ON diet_plans(day_number);

-- workout_plans indexes
CREATE INDEX idx_workout_plans_client ON workout_plans(client_id);
CREATE INDEX idx_workout_plans_day ON workout_plans(day_number);

-- food_logs indexes
CREATE INDEX idx_food_logs_client ON food_logs(client_id);
CREATE INDEX idx_food_logs_logged ON food_logs(logged_at);

-- workout_logs indexes
CREATE INDEX idx_workout_logs_client ON workout_logs(client_id);
CREATE INDEX idx_workout_logs_completed ON workout_logs(completed_at);

-- check_ins indexes
CREATE INDEX idx_check_ins_client ON check_ins(client_id);
CREATE INDEX idx_check_ins_submitted ON check_ins(submitted_at);

-- challenge_progress indexes
CREATE INDEX idx_challenge_visitor ON challenge_progress(visitor_id);
CREATE INDEX idx_challenge_user ON challenge_progress(user_id);

-- assessment_results indexes
CREATE INDEX idx_assessment_visitor ON assessment_results(visitor_id);
CREATE INDEX idx_assessment_user ON assessment_results(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies: profiles
-- -----------------------------------------------------------------------------

-- Clients can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Clients can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- RLS Policies: food_items (read-only for all authenticated users)
-- -----------------------------------------------------------------------------

-- All authenticated users can view food items
CREATE POLICY "Authenticated users can view food items" ON food_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage food items
CREATE POLICY "Admins can manage food items" ON food_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: diet_plans
-- -----------------------------------------------------------------------------

-- Clients can view their own diet plans
CREATE POLICY "Clients can view own diet plans" ON diet_plans
  FOR SELECT USING (auth.uid() = client_id);

-- Admins can view all diet plans
CREATE POLICY "Admins can view all diet plans" ON diet_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can manage all diet plans
CREATE POLICY "Admins can manage diet plans" ON diet_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: food_alternatives
-- -----------------------------------------------------------------------------

-- Clients can view food alternatives for their diet plans
CREATE POLICY "Clients can view own food alternatives" ON food_alternatives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM diet_plans
      WHERE diet_plans.id = food_alternatives.diet_plan_id
      AND diet_plans.client_id = auth.uid()
    )
  );

-- Admins can manage all food alternatives
CREATE POLICY "Admins can manage food alternatives" ON food_alternatives
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: workout_plans
-- -----------------------------------------------------------------------------

-- Clients can view their own workout plans
CREATE POLICY "Clients can view own workout plans" ON workout_plans
  FOR SELECT USING (auth.uid() = client_id);

-- Admins can view all workout plans
CREATE POLICY "Admins can view all workout plans" ON workout_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can manage all workout plans
CREATE POLICY "Admins can manage workout plans" ON workout_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: food_logs
-- -----------------------------------------------------------------------------

-- Clients can manage their own food logs
CREATE POLICY "Clients can manage own food logs" ON food_logs
  FOR ALL USING (auth.uid() = client_id);

-- Admins can view all food logs
CREATE POLICY "Admins can view all food logs" ON food_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: workout_logs
-- -----------------------------------------------------------------------------

-- Clients can manage their own workout logs
CREATE POLICY "Clients can manage own workout logs" ON workout_logs
  FOR ALL USING (auth.uid() = client_id);

-- Admins can view all workout logs
CREATE POLICY "Admins can view all workout logs" ON workout_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: check_ins
-- -----------------------------------------------------------------------------

-- Clients can create and view their own check-ins
CREATE POLICY "Clients can create own check-ins" ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can view own check-ins" ON check_ins
  FOR SELECT USING (auth.uid() = client_id);

-- Admins can view all check-ins
CREATE POLICY "Admins can view all check-ins" ON check_ins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update check-ins (add notes, review)
CREATE POLICY "Admins can update check-ins" ON check_ins
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: challenge_progress
-- -----------------------------------------------------------------------------

-- Anyone can create challenge progress (visitors)
CREATE POLICY "Anyone can create challenge progress" ON challenge_progress
  FOR INSERT WITH CHECK (true);

-- Users can view their own challenge progress by visitor_id
CREATE POLICY "Users can view own challenge progress" ON challenge_progress
  FOR SELECT USING (
    visitor_id IS NOT NULL OR user_id = auth.uid()
  );

-- Users can update their own challenge progress
CREATE POLICY "Users can update own challenge progress" ON challenge_progress
  FOR UPDATE USING (
    visitor_id IS NOT NULL OR user_id = auth.uid()
  );

-- Admins can view all challenge progress
CREATE POLICY "Admins can view all challenge progress" ON challenge_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: assessment_results
-- -----------------------------------------------------------------------------

-- Anyone can create assessment results (visitors)
CREATE POLICY "Anyone can create assessment results" ON assessment_results
  FOR INSERT WITH CHECK (true);

-- Users can view their own assessment results
CREATE POLICY "Users can view own assessment results" ON assessment_results
  FOR SELECT USING (
    visitor_id IS NOT NULL OR user_id = auth.uid()
  );

-- Admins can view all assessment results
CREATE POLICY "Admins can view all assessment results" ON assessment_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Create checkin-photos bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('checkin-photos', 'checkin-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for checkin-photos
CREATE POLICY "Users can upload own check-in photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'checkin-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own check-in photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'checkin-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all check-in photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'checkin-photos' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage policies for avatars (public read, authenticated write)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- TRIGGERS FOR updated_at
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_items_updated_at
  BEFORE UPDATE ON food_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diet_plans_updated_at
  BEFORE UPDATE ON diet_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at
  BEFORE UPDATE ON workout_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_progress_updated_at
  BEFORE UPDATE ON challenge_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
