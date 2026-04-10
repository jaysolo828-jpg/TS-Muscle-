-- Migration 022: Allow standalone (non-challenge) Health Connect sync.
--
-- Makes challenge_id nullable so HC sessions can be imported directly
-- into the cardio tracker without being tied to a CYH group challenge.
-- Users can now sync their walks and runs from Android Health Connect
-- at any time, not just when an active CYH challenge exists.

-- Drop NOT NULL — the FK constraint itself stays (NULL values bypass it
-- in Postgres, which is exactly the behaviour we want here).
ALTER TABLE public.cyh_logs
  ALTER COLUMN challenge_id DROP NOT NULL;

-- Partial unique index prevents the same HC session being imported twice
-- as a standalone log. The existing UNIQUE constraint on
-- (challenge_id, hc_session_id) covers challenge rows; NULL values in
-- challenge_id bypass that constraint in Postgres, so we need this.
CREATE UNIQUE INDEX IF NOT EXISTS cyh_logs_standalone_hc_dedup
  ON public.cyh_logs (hc_session_id)
  WHERE challenge_id IS NULL AND hc_session_id IS NOT NULL;

-- Update SELECT policy: standalone rows (challenge_id IS NULL) are visible
-- to their owner only; challenge rows remain visible to all participants.
DROP POLICY IF EXISTS cyh_logs_participant_select ON public.cyh_logs;
CREATE POLICY cyh_logs_participant_select ON public.cyh_logs
  FOR SELECT
  USING (
    (challenge_id IS NULL  AND user_id = auth.uid())
    OR
    (challenge_id IS NOT NULL AND public.ts_user_is_challenge_participant(challenge_id))
  );

-- Update INSERT policy: standalone inserts allowed for any signed-in user;
-- challenge inserts still require participant membership.
DROP POLICY IF EXISTS cyh_logs_own_insert ON public.cyh_logs;
CREATE POLICY cyh_logs_own_insert ON public.cyh_logs
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      challenge_id IS NULL
      OR public.ts_user_is_challenge_participant(challenge_id)
    )
  );

-- cyh_logs_own_delete is unchanged (user_id = auth.uid() covers both cases).
