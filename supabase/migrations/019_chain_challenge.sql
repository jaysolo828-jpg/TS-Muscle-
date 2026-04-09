-- 019_chain_challenge.sql
-- Adds the "Don't Break the Chain" challenge type.
-- New challenge_type value, new columns on challenges and
-- challenge_participants, and a new chain_weeks table for
-- weekly evaluation history.

-- 1. Add 'dont_break_chain' to the challenge_type CHECK.
ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_challenge_type_check
    CHECK (challenge_type IN ('one_rep_max', 'dont_break_chain'));

-- 2. New columns on challenges for chain-specific state.
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS chain_mode         text    CHECK (chain_mode IN ('strict', 'one_strike')),
  ADD COLUMN IF NOT EXISTS chain_days         int     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chain_broken_by_ids uuid[] DEFAULT '{}';

-- 3. New columns on challenge_participants for chain-specific state.
ALTER TABLE public.challenge_participants
  ADD COLUMN IF NOT EXISTS weekly_target int,
  ADD COLUMN IF NOT EXISTS dot_color     text,
  ADD COLUMN IF NOT EXISTS weeks_hit     int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weeks_total   int NOT NULL DEFAULT 0;

-- 4. Weekly evaluation results table.
CREATE TABLE IF NOT EXISTS public.chain_weeks (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id     uuid        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  week_number      int         NOT NULL,
  week_start       timestamptz NOT NULL,
  week_end         timestamptz NOT NULL,
  evaluated_at     timestamptz NOT NULL DEFAULT now(),
  chain_survived   boolean     NOT NULL,
  missed_user_ids  uuid[]      NOT NULL DEFAULT '{}',
  forgiven_user_id uuid,
  UNIQUE (challenge_id, week_number)
);

ALTER TABLE public.chain_weeks ENABLE ROW LEVEL SECURITY;

-- Participants can read their own challenge's week history.
-- Uses the existing SECURITY DEFINER helper to avoid RLS recursion.
CREATE POLICY chain_weeks_participant_select ON public.chain_weeks
  FOR SELECT
  USING (public.ts_user_is_challenge_participant(challenge_id));

-- chain_weeks rows are inserted by the service-role edge function only.
-- No INSERT/UPDATE/DELETE policy for the authenticated role.
