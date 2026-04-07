-- ============================================================
-- T&S Muscle — Per-friend workout notification mutes
--
-- A row in this table means: muter_id has muted muted_friend_id
-- from receiving "started training" notifications about muter_id's
-- workouts. Reactions, friend requests, and other social pings are
-- NOT affected — only the active-workout fan-out from send-push.
--
-- The mute is one-way and private: the muted friend has no way to
-- see they've been muted. RLS only allows a user to read/write
-- their own mute rows.
-- ============================================================

create table if not exists public.workout_notif_mutes (
  muter_id        uuid not null references public.users(id) on delete cascade,
  muted_friend_id uuid not null references public.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (muter_id, muted_friend_id),
  -- A user cannot mute themselves
  check (muter_id <> muted_friend_id)
);

-- Lookup index for the send-push fan-out filter
create index if not exists workout_notif_mutes_muter_idx
  on public.workout_notif_mutes (muter_id);

alter table public.workout_notif_mutes enable row level security;

-- A user can read, insert, update, and delete their own mute rows.
-- They cannot see mutes other users have set against them.
create policy "mutes_own_all"
  on public.workout_notif_mutes
  for all
  using (muter_id = auth.uid())
  with check (muter_id = auth.uid());
