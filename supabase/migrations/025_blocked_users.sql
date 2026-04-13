-- 025_blocked_users.sql
-- Per-user block list. A blocker can prevent any other user from finding
-- their profile, sending friend requests, or seeing their workout activity.
-- The blocked user is not notified that they have been blocked.
--
-- RLS: a user can only read, insert, and delete their own blocker rows.
-- The blocked user cannot see that they appear in another user's block list.
--
-- Apply in Supabase SQL Editor BEFORE merging the block feature code.

CREATE TABLE IF NOT EXISTS public.blocked_users (
  blocker_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own block entries.
CREATE POLICY blocks_own_all ON public.blocked_users
  FOR ALL
  USING  (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

-- Index so "who has this user blocked?" lookups are fast if needed later.
CREATE INDEX IF NOT EXISTS blocked_users_blocked_id_idx ON public.blocked_users (blocked_id);
