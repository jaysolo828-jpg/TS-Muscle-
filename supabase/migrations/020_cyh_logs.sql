-- cyh_logs: stores individual walking/running session logs for the
-- "Clear Your Head" group challenge. Rows are inserted either by the
-- Android Health Connect sync bridge (hc_session_id set) or by manual
-- in-challenge logging (hc_session_id null).
--
-- The UNIQUE constraint on (challenge_id, hc_session_id) lets the native
-- sync bridge upsert with Prefer: resolution=ignore-duplicates so the
-- same Health Connect session is never double-counted across syncs.
-- NULL values in hc_session_id are not considered equal by Postgres, so
-- multiple manual logs in the same challenge don't conflict.

CREATE TABLE IF NOT EXISTS public.cyh_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id   uuid        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL,
  logged_at      timestamptz NOT NULL DEFAULT now(),
  minutes        int         NOT NULL CHECK (minutes > 0),
  mood           text        CHECK (mood IN ('better', 'same', 'worse')),
  hc_session_id  text,
  UNIQUE (challenge_id, hc_session_id)
);

ALTER TABLE public.cyh_logs ENABLE ROW LEVEL SECURITY;

-- All participants in a challenge can read every log for that challenge
-- (needed to show group total and per-member contributions in the detail
-- sheet). Uses the same SECURITY DEFINER helper as other challenge tables
-- to avoid the RLS recursion Postgres rejects at plan time.
CREATE POLICY cyh_logs_participant_select ON public.cyh_logs
  FOR SELECT
  USING (public.ts_user_is_challenge_participant(challenge_id));

-- Users can only insert their own logs, and only for challenges they
-- are a participant in.
CREATE POLICY cyh_logs_own_insert ON public.cyh_logs
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.ts_user_is_challenge_participant(challenge_id)
  );

-- Users can delete their own logs (e.g. accidental manual entry).
CREATE POLICY cyh_logs_own_delete ON public.cyh_logs
  FOR DELETE
  USING (user_id = auth.uid());
