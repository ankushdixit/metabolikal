-- Add unique constraint on user_id for assessment_results
-- This allows upsert operations to work correctly

-- First, remove any duplicate user_id entries (keep the most recent one)
DELETE FROM assessment_results a
WHERE a.id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM assessment_results
  WHERE user_id IS NOT NULL
  ORDER BY user_id, assessed_at DESC NULLS LAST
)
AND a.user_id IS NOT NULL;

-- Add unique constraint on user_id (allowing multiple null values for anonymous assessments)
CREATE UNIQUE INDEX IF NOT EXISTS assessment_results_user_id_unique
ON assessment_results (user_id)
WHERE user_id IS NOT NULL;

-- Add RLS policy for authenticated users to insert/update their own assessment results
DROP POLICY IF EXISTS "Users can insert their own assessment results" ON assessment_results;
CREATE POLICY "Users can insert their own assessment results"
  ON assessment_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own assessment results" ON assessment_results;
CREATE POLICY "Users can update their own assessment results"
  ON assessment_results
  FOR UPDATE
  USING (auth.uid() = user_id);
