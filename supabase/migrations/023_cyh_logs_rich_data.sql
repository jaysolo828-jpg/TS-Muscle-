-- Migration 023: Add rich Health Connect data columns to cyh_logs.
--
-- The initial HC sync (migration 022) only stored duration (minutes) and
-- session id. This migration adds distance, calorie, step, and exercise-type
-- fields so the cardio tab and WorkManager background sync can surface
-- richer data from Android watches and phones.

ALTER TABLE public.cyh_logs
  ADD COLUMN IF NOT EXISTS distance_meters FLOAT,
  ADD COLUMN IF NOT EXISTS calories        INT,
  ADD COLUMN IF NOT EXISTS steps           BIGINT,
  ADD COLUMN IF NOT EXISTS exercise_type   TEXT;

-- No new RLS is required — the existing policies cover all columns.
-- Existing rows will have NULL in the new columns, which is fine.
