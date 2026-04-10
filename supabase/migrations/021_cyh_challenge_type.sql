-- Add 'clear_your_head' to the challenge_type CHECK constraint and add
-- the cyh_weekly_goal_mins column used by the CYH create flow.
--
-- Run in the Supabase SQL Editor BEFORE deploying the web changes that
-- reference challenge_type = 'clear_your_head' or cyh_weekly_goal_mins.

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_challenge_type_check
  CHECK (challenge_type IN ('one_rep_max', 'dont_break_chain', 'clear_your_head'));

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS cyh_weekly_goal_mins int;
