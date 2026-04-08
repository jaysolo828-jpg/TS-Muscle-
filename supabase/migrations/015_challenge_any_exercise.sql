-- ============================================================
-- T&S Muscle — 1RM Challenges: allow any exercise
--
-- Migration 014 locked challenge_participants.exercise_name to the
-- big 4 (squat, bench, deadlift, ohp). The product direction is
-- that any exercise should be allowed, so the user can pick the
-- lift they actually train — not just the classic four.
--
-- This migration drops the CHECK constraint so exercise_name can
-- hold any text value (still not null, still no length cap).
-- Existing rows with one of the old values remain valid.
-- ============================================================

alter table public.challenge_participants
  drop constraint if exists challenge_participants_exercise_name_check;
