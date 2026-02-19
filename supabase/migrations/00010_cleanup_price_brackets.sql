-- Cleanup: deactivate improperly created price bracket events
-- These were created as standalone binary events before the grouping migration.
-- They should be recreated by the auto-mapper as proper parent/child groups.

-- Step 1: Unlink source contracts from malformed price events
UPDATE source_contracts
SET event_id = NULL
WHERE event_id IN (
  SELECT id FROM events
  WHERE (
    title ILIKE '%price on %'
    OR title ILIKE '%price above%'
    OR title ILIKE '%price below%'
    OR title ILIKE '%price %k-%'
    OR title ILIKE '%price $%'
  )
  AND parent_event_id IS NULL
  AND outcome_type = 'binary'
);

-- Step 2: Remove their event_source_mappings
DELETE FROM event_source_mappings
WHERE event_id IN (
  SELECT id FROM events
  WHERE (
    title ILIKE '%price on %'
    OR title ILIKE '%price above%'
    OR title ILIKE '%price below%'
    OR title ILIKE '%price %k-%'
    OR title ILIKE '%price $%'
  )
  AND parent_event_id IS NULL
  AND outcome_type = 'binary'
);

-- Step 3: Remove probability snapshots for these events
DELETE FROM probability_snapshots
WHERE event_id IN (
  SELECT id FROM events
  WHERE (
    title ILIKE '%price on %'
    OR title ILIKE '%price above%'
    OR title ILIKE '%price below%'
    OR title ILIKE '%price %k-%'
    OR title ILIKE '%price $%'
  )
  AND parent_event_id IS NULL
  AND outcome_type = 'binary'
);

-- Step 4: Deactivate the malformed events
UPDATE events
SET is_active = false
WHERE (
  title ILIKE '%price on %'
  OR title ILIKE '%price above%'
  OR title ILIKE '%price below%'
  OR title ILIKE '%price %k-%'
  OR title ILIKE '%price $%'
)
AND parent_event_id IS NULL
AND outcome_type = 'binary';

-- Also deactivate any Senate race events that are clearly categorical
-- (multi-candidate races showing as individual binary events)
UPDATE events
SET is_active = false
WHERE title ILIKE '%Senate race%'
AND parent_event_id IS NULL
AND outcome_type = 'binary'
AND (probability > 0.95 OR probability < 0.05);
