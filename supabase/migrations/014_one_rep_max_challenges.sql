-- ============================================================
-- T&S Muscle — 1RM Challenges
--
-- Adds everything needed for the 1 Rep Max Challenge feature:
--
--  1. Expands challenges.challenge_type to include 'one_rep_max'.
--  2. Expands challenges.status to include 'cancelled' (either
--     participant can pull the plug on an active challenge).
--  3. Adds duration_weeks to challenges so the app can store the
--     4/5/6 week window the creator chose.
--  4. Creates challenge_participants, the table that holds each
--     participant's chosen lift, baseline, and final results. A
--     participant row is ONLY written when that user has committed
--     to the challenge (creator on create; invitee on accept), so
--     the existence of a row is the consent record.
--
-- Privacy model (important — do not change without re-reading):
--
--   When Alice creates a challenge, her own challenge_participants
--   row is inserted immediately (her numbers are visible to Bob the
--   moment he sees the invite — that's her consent). When Bob
--   accepts, HIS row is inserted (his numbers become visible to
--   Alice at that moment — that's his consent). If Bob declines,
--   no row is ever inserted for him and Alice never sees his
--   numbers. Cancelling/completing a challenge leaves both rows
--   in place so history stays readable.
--
-- Scoring (computed on the client, stored here for display):
--
--   e1RM = weight * (1 + reps / 30)   -- Epley
--   improvement_pct = (final_e1rm - baseline_e1rm) / baseline_e1rm * 100
--
--   Each participant picks their own lift from the big 4 (squat /
--   bench / deadlift / ohp). Scoring in percentage terms is what
--   keeps the challenge fair when the two athletes are at very
--   different strength levels.
-- ============================================================

-- 1. Expand challenge_type to include 'one_rep_max'.

alter table public.challenges
  drop constraint if exists challenges_challenge_type_check;

alter table public.challenges
  add constraint challenges_challenge_type_check
  check (challenge_type in ('streak', 'volume', 'sessions', 'one_rep_max'));

-- 2. Expand status to include 'cancelled'.

alter table public.challenges
  drop constraint if exists challenges_status_check;

alter table public.challenges
  add constraint challenges_status_check
  check (status in ('pending', 'active', 'completed', 'declined', 'cancelled'));

-- 3. Duration column (4, 5, or 6 weeks).

alter table public.challenges
  add column if not exists duration_weeks int;

-- 4. challenge_participants table.

create table if not exists public.challenge_participants (
  id              uuid primary key default gen_random_uuid(),
  challenge_id    uuid not null references public.challenges(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  exercise_name   text not null check (exercise_name in ('squat', 'bench', 'deadlift', 'ohp')),
  baseline_weight numeric(10,2) not null,
  baseline_reps   int           not null check (baseline_reps >= 1 and baseline_reps <= 20),
  baseline_e1rm   numeric(10,2) not null,
  final_weight    numeric(10,2),
  final_reps      int,
  final_e1rm      numeric(10,2),
  joined_at       timestamptz   not null default now(),
  unique (challenge_id, user_id)
);

create index if not exists idx_challenge_participants_user
  on public.challenge_participants (user_id);

create index if not exists idx_challenge_participants_challenge
  on public.challenge_participants (challenge_id);

alter table public.challenge_participants enable row level security;

-- SELECT: a user can read a participant row if it's their own, OR if
-- they are listed as challenger/challenged on the parent challenge.
-- The "listed on parent" branch is what lets Bob see Alice's baseline
-- on his invite, and lets Alice see Bob's baseline once he's joined.
create policy "participants_select"
  on public.challenge_participants
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.challenges c
      where c.id = challenge_participants.challenge_id
        and (c.challenger_id = auth.uid() or c.challenged_id = auth.uid())
    )
  );

-- INSERT: only a user can insert their OWN participant row, and only
-- into a challenge that lists them as challenger or challenged. This
-- is what enforces "row existence = personal consent to reveal".
create policy "participants_self_insert"
  on public.challenge_participants
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.challenges c
      where c.id = challenge_participants.challenge_id
        and (c.challenger_id = auth.uid() or c.challenged_id = auth.uid())
    )
  );

-- UPDATE: own row only (used to write final_weight/reps/e1rm at the
-- end of the challenge).
create policy "participants_self_update"
  on public.challenge_participants
  for update
  using (user_id = auth.uid());

-- DELETE: own row only. Rarely used in the app — the usual removal
-- path is the ON DELETE CASCADE from challenges — but keep it so a
-- user can withdraw their row directly if needed.
create policy "participants_self_delete"
  on public.challenge_participants
  for delete
  using (user_id = auth.uid());
