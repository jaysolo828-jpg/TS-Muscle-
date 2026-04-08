-- ============================================================
-- T&S Muscle — 1RM Challenges: fix RLS so invitees can read
--
-- Migration 016 turned challenges into a multi-person contest
-- where the invitee list lives in challenge_participants instead
-- of on the parent challenges row (challenged_id is NULL for new
-- multi-person rows). But migration 001's RLS on public.challenges
-- only allows SELECT when the caller is listed directly as
-- challenger_id or challenged_id on the parent — which means
-- invitees on a multi-person challenge can't read the parent row
-- even though they have a valid participant row on it. Result:
-- when the invitee taps their push notification, _loadChallenges
-- returns nothing for them and the detail sheet shows "Challenge
-- not found."
--
-- This migration broadens two policies on public.challenges to
-- also accept "I have a participant row on this challenge" as a
-- valid basis for SELECT and UPDATE. Legacy 1v1 rows where
-- challenged_id is set still pass via the old branch. The INSERT
-- policy (creator-only) is unchanged.
--
-- The UPDATE broadening is what lets a non-creator participant
-- flip the challenge row to 'cancelled' when they quit and the
-- remaining joined roster drops below 2 — _quitChallenge in the
-- client does this right after it marks its own row as 'left'.
-- ============================================================

drop policy if exists "challenges_participant_select" on public.challenges;
drop policy if exists "challenges_participant_update" on public.challenges;

create policy "challenges_participant_select"
  on public.challenges
  for select
  using (
    challenger_id = auth.uid()
    or challenged_id = auth.uid()
    or exists (
      select 1 from public.challenge_participants p
      where p.challenge_id = challenges.id
        and p.user_id = auth.uid()
    )
  );

create policy "challenges_participant_update"
  on public.challenges
  for update
  using (
    challenger_id = auth.uid()
    or challenged_id = auth.uid()
    or exists (
      select 1 from public.challenge_participants p
      where p.challenge_id = challenges.id
        and p.user_id = auth.uid()
    )
  );
