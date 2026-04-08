-- ============================================================
-- T&S Muscle — 1RM Challenges: fix RLS infinite recursion
--
-- Migration 016's participants_select policy included a
-- self-reference against challenge_participants to cover the
-- "I can see other rows on challenges I'm in" case:
--
--   or exists (
--     select 1 from public.challenge_participants mine
--     where mine.challenge_id = challenge_participants.challenge_id
--       and mine.user_id = auth.uid()
--   )
--
-- Postgres flags this as infinite recursion — the inner SELECT
-- re-evaluates the same RLS policy on challenge_participants.
-- Migration 017's challenges_participant_select made it worse
-- by adding a cross-table reference in the other direction, so
-- reading either table triggered an RLS check on the other,
-- which triggered a check on the first, forever.
--
-- Even though the creator's path would short-circuit on
-- challenger_id = auth.uid() at runtime, Postgres's recursion
-- detector is conservative and rejects the query at plan time.
-- Result: SEND CHALLENGE silently fails with "infinite recursion
-- detected in policy for relation challenge_participants".
--
-- Standard fix: hoist the membership check into a SECURITY
-- DEFINER function. SD functions run with the owner's privileges
-- and bypass RLS on the tables they touch, so the function can
-- read challenge_participants without re-triggering the
-- participants_select policy. Both policies then call the
-- function instead of doing inline exists subqueries.
-- ============================================================

-- Helper: "does the current auth user have a participant row on
-- this challenge?" — regardless of status. SECURITY DEFINER so
-- the SELECT inside bypasses RLS on challenge_participants.
create or replace function public.ts_user_is_challenge_participant(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.challenge_participants
    where challenge_id = cid
      and user_id = auth.uid()
  );
$$;

revoke all on function public.ts_user_is_challenge_participant(uuid) from public;
grant execute on function public.ts_user_is_challenge_participant(uuid) to authenticated;

-- Rewrite participants_select WITHOUT the recursive self-reference.
-- The membership check goes through the SD function instead.
drop policy if exists "participants_select" on public.challenge_participants;

create policy "participants_select"
  on public.challenge_participants
  for select
  using (
    user_id = auth.uid()
    or public.ts_user_is_challenge_participant(challenge_id)
    or exists (
      select 1 from public.challenges c
      where c.id = challenge_participants.challenge_id
        and (c.challenger_id = auth.uid() or c.challenged_id = auth.uid())
    )
  );

-- Rewrite challenges_participant_select to use the function instead
-- of an inline subquery against challenge_participants.
drop policy if exists "challenges_participant_select" on public.challenges;

create policy "challenges_participant_select"
  on public.challenges
  for select
  using (
    challenger_id = auth.uid()
    or challenged_id = auth.uid()
    or public.ts_user_is_challenge_participant(id)
  );

-- Same treatment for the update policy — it had the same cycle.
drop policy if exists "challenges_participant_update" on public.challenges;

create policy "challenges_participant_update"
  on public.challenges
  for update
  using (
    challenger_id = auth.uid()
    or challenged_id = auth.uid()
    or public.ts_user_is_challenge_participant(id)
  );
