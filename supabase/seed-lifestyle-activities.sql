-- Seed common lifestyle activity types
-- Run this after the 20260127000000_timeline_schema_and_libraries.sql migration

-- Insert only if table is empty (to avoid duplicates)
INSERT INTO lifestyle_activity_types (name, category, default_target_value, target_unit, description, rationale, icon, is_active, display_order)
SELECT * FROM (VALUES
  (
    'Daily Steps',
    'movement',
    12000,
    'steps',
    'Walk or move throughout the day to reach your step goal',
    'Increases daily caloric expenditure, improves cardiovascular health, and supports weight management by deepening caloric deficit. Regular walking also enhances mood and reduces stress.',
    'footprints',
    true,
    1
  ),
  (
    'Sunlight Exposure',
    'sunlight',
    15,
    'minutes',
    'Get natural sunlight exposure, preferably in the morning',
    'Promotes Vitamin D synthesis essential for bone health and immune function. Regulates melatonin rhythm for better sleep quality. Morning sunlight helps set circadian rhythm.',
    'sun',
    true,
    2
  ),
  (
    'Gratitude Journaling',
    'mindfulness',
    1,
    'session',
    'Write down things you are grateful for, ideally before sleep',
    'Cultivates positive mindset, reduces stress and anxiety, and improves mental well-being. Evening practice helps transition to restful sleep with positive thoughts.',
    'book-open',
    true,
    3
  ),
  (
    'Evening Walk',
    'movement',
    20,
    'minutes',
    'Take a light walk after dinner',
    'Aids digestion after evening meal, reduces stress levels, and promotes better sleep. Light activity helps regulate blood sugar and supports metabolic health.',
    'footprints',
    true,
    4
  ),
  (
    'Hydration',
    'hydration',
    8,
    'glasses',
    'Drink adequate water throughout the day',
    'Supports optimal metabolic function and energy levels. Proper hydration aids digestion, nutrient absorption, and helps control appetite. Essential for cellular health.',
    'droplet',
    true,
    5
  ),
  (
    'Sleep',
    'sleep',
    8,
    'hours',
    'Get quality sleep each night',
    'Essential for recovery, hormone regulation, and weight management. Quality sleep supports muscle recovery, cognitive function, and metabolic health. Critical for fat loss goals.',
    'moon',
    true,
    6
  ),
  (
    'Floor Climbing',
    'movement',
    10,
    'floors',
    'Take stairs instead of elevator throughout the day',
    'Increases heart rate and builds leg strength. Stair climbing burns more calories per minute than walking and improves cardiovascular fitness effectively.',
    'zap',
    true,
    7
  ),
  (
    'Meditation',
    'mindfulness',
    10,
    'minutes',
    'Practice mindfulness or meditation',
    'Reduces stress hormones like cortisol that can interfere with weight loss. Improves focus, emotional regulation, and helps prevent stress eating.',
    'brain',
    true,
    8
  ),
  (
    'Social Connection',
    'social',
    1,
    'interaction',
    'Have meaningful connection with friends or family',
    'Strong social connections support mental health and reduce stress. Social support is linked to better adherence to health goals and overall well-being.',
    'users',
    true,
    9
  ),
  (
    'Active Recovery',
    'recovery',
    15,
    'minutes',
    'Light stretching, foam rolling, or mobility work',
    'Supports muscle recovery and reduces injury risk. Active recovery improves flexibility, reduces muscle soreness, and prepares body for next workout.',
    'heart',
    true,
    10
  )
) AS v(name, category, default_target_value, target_unit, description, rationale, icon, is_active, display_order)
WHERE NOT EXISTS (SELECT 1 FROM lifestyle_activity_types LIMIT 1);
