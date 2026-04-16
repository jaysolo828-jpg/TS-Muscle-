-- Migration 021: Control the Aux challenge
--
-- Adds the 'control_the_aux' challenge type and three supporting tables:
--   aux_songs     — weekly song submissions (max 3 per user per week)
--   aux_reactions — fire/fuel/vibe reactions (one per user per song)
--   aux_uses      — "used in my workout" markers (one per user per song)
--
-- Scoring: each reaction received = 1 pt, each use received = 5 pts.
-- Winner = highest total points when the challenge ends.
--
-- Run before merging code that references challenge_type = 'control_the_aux'.

-- ── 1. Extend challenge_type CHECK ───────────────────────────────────────────
ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_challenge_type_check
  CHECK (challenge_type IN ('one_rep_max', 'dont_break_chain', 'clear_your_head', 'control_the_aux'));

-- ── 2. aux_songs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aux_songs (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id    uuid        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  artist          text        NOT NULL DEFAULT '',
  artwork_url     text,
  original_url    text        NOT NULL,
  odesli_key      text,                       -- odesli entityUniqueId for dedup
  platform_links  jsonb       NOT NULL DEFAULT '{}',
  week_number     int         NOT NULL,        -- ISO week number (1–53)
  week_year       int         NOT NULL,        -- ISO week-year (differs from calendar year at boundaries)
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS aux_songs_challenge_week
  ON public.aux_songs(challenge_id, week_year, week_number);

-- ── 3. aux_reactions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aux_reactions (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id         uuid        NOT NULL REFERENCES public.aux_songs(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type   text        NOT NULL CHECK (reaction_type IN ('fire', 'fuel', 'vibe')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (song_id, user_id)   -- one reaction per user per song (can change type via upsert)
);

-- ── 4. aux_uses ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aux_uses (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id         uuid        NOT NULL REFERENCES public.aux_songs(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (song_id, user_id)   -- one use per user per song
);

-- ── 5. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.aux_songs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aux_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aux_uses      ENABLE ROW LEVEL SECURITY;

-- aux_songs: challenge participants can read all songs for their challenge.
-- Only the owner can insert or delete their own rows.
CREATE POLICY aux_songs_participant_read ON public.aux_songs
  FOR SELECT USING (public.ts_user_is_challenge_participant(challenge_id));

CREATE POLICY aux_songs_own_insert ON public.aux_songs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.ts_user_is_challenge_participant(challenge_id)
  );

CREATE POLICY aux_songs_own_delete ON public.aux_songs
  FOR DELETE USING (auth.uid() = user_id);

-- aux_reactions: participants can read all reactions within their challenge.
-- Can only react to songs you didn't submit. Can delete your own reactions.
CREATE POLICY aux_reactions_participant_read ON public.aux_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.aux_songs s
      WHERE s.id = song_id
        AND public.ts_user_is_challenge_participant(s.challenge_id)
    )
  );

CREATE POLICY aux_reactions_own_insert ON public.aux_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.aux_songs s
      WHERE s.id = song_id
        AND s.user_id <> auth.uid()
        AND public.ts_user_is_challenge_participant(s.challenge_id)
    )
  );

CREATE POLICY aux_reactions_own_delete ON public.aux_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- aux_uses: same pattern as reactions.
CREATE POLICY aux_uses_participant_read ON public.aux_uses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.aux_songs s
      WHERE s.id = song_id
        AND public.ts_user_is_challenge_participant(s.challenge_id)
    )
  );

CREATE POLICY aux_uses_own_insert ON public.aux_uses
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.aux_songs s
      WHERE s.id = song_id
        AND s.user_id <> auth.uid()
        AND public.ts_user_is_challenge_participant(s.challenge_id)
    )
  );

CREATE POLICY aux_uses_own_delete ON public.aux_uses
  FOR DELETE USING (auth.uid() = user_id);
