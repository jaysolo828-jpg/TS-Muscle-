-- ============================================================
-- T&S Muscle — 1RM Challenges: multi-person support
--
-- Previous state (migrations 014 + 015): challenges are strictly
-- 1v1. A single challenged_id user is listed on the parent row and
-- there's no concept of an "invited" participant — rows in
-- challenge_participants only exist AFTER the user has committed.
--
-- This migration turns challenges into "a contest that can have
-- 1-3 invited opponents" while keeping all the old 1v1 data valid.
--
-- Changes:
--
--  1. challenges.challenged_id is now NULLABLE. New multi-person
--     challenges leave it NULL; the full invitee list lives in
--     challenge_participants. Old 1v1 rows keep their non-null
--     value and continue to work.
--
--  2. challenges.auto_start_at — timestamptz column. On create,
--     the client sets this to created_at + 48h. The scheduled
--     challenge-tick cron checks this to auto-start or auto-cancel.
--
--  3. challenge_participants.status — new text column with CHECK.
--     Values: 'invited' (not responded yet), 'joined' (accepted +
--     has baseline), 'declined' (turned it down), 'left' (quit
--     mid-active = forfeit). Existing rows get 'joined' so legacy
--     data reads correctly.
--
--  4. challenge_participants.last_reminded_at — tracks the last
--     daily reminder we sent to an 'invited' row, so the cron
--     can throttle at ~1/day.
--
--  5. challenge_participants: baseline_weight / baseline_reps /
--     baseline_e1rm / exercise_name become NULLABLE. They have to
--     be, because 'invited' rows are inserted before the user has
--     picked a lift or logged any numbers.
--
--  6. RLS rewrite: the old "you can see a participant row if
--     you're listed as challenger/challenged on the parent" rule
--     still works for legacy 1v1 rows, but we add a second branch
--     so new multi-person rows are visible to anyone who has their
--     own participant row on the same challenge. INSERT gets a
--     second branch so the creator can batch-insert 'invited' rows
--     for everyone they're inviting.
-- ============================================================

-- 1. Allow challenged_id to be NULL for new multi-person challenges.
alter table public.challenges
  alter column challenged_id drop not null;

-- 2. auto_start_at — when the 48h grace period runs out.
alter table public.challenges
  add column if not exists auto_start_at timestamptz;

-- 3. challenge_participants.status
alter table public.challenge_participants
  add column if not exists status text not null default 'joined'
    check (status in ('invited', 'joined', 'declined', 'left'));

-- 4. challenge_participants.last_reminded_at
alter table public.challenge_participants
  add column if not exists last_reminded_at timestamptz;

-- 5. Baseline fields become nullable so 'invited' rows can exist
--    without any numbers filled in yet.
alter table public.challenge_participants
  alter column baseline_weight drop not null,
  alter column baseline_reps   drop not null,
  alter column baseline_e1rm   drop not null,
  alter column exercise_name   drop not null;

-- 6. RLS rewrite.

drop policy if exists "participants_select"      on public.challenge_participants;
drop policy if exists "participants_self_insert" on public.challenge_participants;

-- SELECT: own row always; or I have my own row on the same challenge
-- (covers new multi-person — invitees see each other once they have
-- their 'invited' row); or I'm listed as challenger/challenged on the
-- parent challenge (covers legacy 1v1 rows from before migration 016).
create policy "participants_select"
  on public.challenge_participants
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.challenge_participants mine
      where mine.challenge_id = challenge_participants.challenge_id
        and mine.user_id = auth.uid()
    )
    or exists (
      select 1 from public.challenges c
      where c.id = challenge_participants.challenge_id
        and (c.challenger_id = auth.uid() or c.challenged_id = auth.uid())
    )
  );

-- INSERT: either I'm inserting my own row on a challenge I'm listed on
-- (self-insert — used by legacy accept flow and the creator's own
-- 'joined' row), or I'm the creator of the challenge and I'm inserting
-- an 'invited' row for someone else I'm inviting.
create policy "participants_insert"
  on public.challenge_participants
  for insert
  with check (
    (
      user_id = auth.uid()
      and exists (
        select 1 from public.challenges c
        where c.id = challenge_participants.challenge_id
          and (c.challenger_id = auth.uid() or c.challenged_id = auth.uid())
      )
    )
    or (
      status = 'invited'
      and exists (
        select 1 from public.challenges c
        where c.id = challenge_participants.challenge_id
          and c.challenger_id = auth.uid()
      )
    )
  );
