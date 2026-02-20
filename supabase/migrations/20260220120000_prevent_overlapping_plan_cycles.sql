-- =============================================================================
-- Prevent Overlapping Plan Cycles
-- =============================================================================
-- Adds a BEFORE INSERT OR UPDATE trigger on plan_cycles that rejects any row
-- whose date range overlaps with another cycle for the same client_id.
-- =============================================================================

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION check_plan_cycle_overlap()
RETURNS TRIGGER AS $$
DECLARE
  new_start DATE;
  new_end DATE;
  conflicting_cycle RECORD;
BEGIN
  new_start := NEW.start_date;
  new_end := NEW.start_date + (NEW.duration_days - 1);

  -- Check for any other cycle for the same client whose date range overlaps
  SELECT cycle_number, start_date,
         start_date + (duration_days - 1) AS end_date
  INTO conflicting_cycle
  FROM plan_cycles
  WHERE client_id = NEW.client_id
    AND id IS DISTINCT FROM NEW.id  -- exclude the row being updated
    AND (
      -- ranges overlap if one starts before the other ends and vice versa
      start_date <= new_end
      AND (start_date + (duration_days - 1)) >= new_start
    )
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Plan cycle overlaps with existing cycle % (% to %). New plan must start after %.',
      conflicting_cycle.cycle_number,
      conflicting_cycle.start_date,
      conflicting_cycle.end_date,
      conflicting_cycle.end_date + 1
    USING ERRCODE = 'exclusion_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the trigger
DROP TRIGGER IF EXISTS trg_check_plan_cycle_overlap ON plan_cycles;
CREATE TRIGGER trg_check_plan_cycle_overlap
  BEFORE INSERT OR UPDATE ON plan_cycles
  FOR EACH ROW
  EXECUTE FUNCTION check_plan_cycle_overlap();
