-- Add neck and calves measurement columns to check_ins table
ALTER TABLE check_ins
  ADD COLUMN neck_cm DECIMAL(5,1),
  ADD COLUMN calves_cm DECIMAL(5,1);
