-- ============================================================
-- T&S Muscle — Social Layer Schema
-- Phase 1: User accounts, friends, notifications, reactions,
--           challenges. Training data stays in localStorage.
-- ============================================================

-- Users (mirrors auth.users, stores display info)
create table if not exists public.users (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null,
  username      text unique not null,
  avatar_color  text not null default '#C0392B',
  created_at    timestamptz not null default now(),
  last_active   timestamptz
);

-- Friendships
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  addressee_id uuid not null references public.users(id) on delete cascade,
  status       text not null check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now()
);

-- Workout signals (public workout activity)
create table if not exists public.workout_signals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  workout_name text,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  signal_type  text not null check (signal_type in ('started', 'completed', 'pr', 'hard_day'))
);

-- Reactions on workout signals
create table if not exists public.reactions (
  id            uuid primary key default gen_random_uuid(),
  from_user_id  uuid not null references public.users(id) on delete cascade,
  to_user_id    uuid not null references public.users(id) on delete cascade,
  signal_id     uuid not null references public.workout_signals(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('fist_bump', 'fire', 'checkmark')),
  created_at    timestamptz not null default now()
);

-- Challenges between users
create table if not exists public.challenges (
  id             uuid primary key default gen_random_uuid(),
  challenger_id  uuid not null references public.users(id) on delete cascade,
  challenged_id  uuid not null references public.users(id) on delete cascade,
  challenge_type text not null check (challenge_type in ('streak', 'volume', 'sessions')),
  start_date     timestamptz,
  end_date       timestamptz,
  status         text not null check (status in ('pending', 'active', 'completed', 'declined')),
  winner_id      uuid references public.users(id),
  created_at     timestamptz not null default now()
);

-- OneSignal push subscriptions
create table if not exists public.onesignal_subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  onesignal_player_id text not null,
  platform            text not null check (platform in ('android', 'ios', 'web')),
  created_at          timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users                  enable row level security;
alter table public.friendships            enable row level security;
alter table public.workout_signals        enable row level security;
alter table public.reactions              enable row level security;
alter table public.challenges             enable row level security;
alter table public.onesignal_subscriptions enable row level security;

-- ── users ────────────────────────────────────────────────────

-- Own full access
create policy "users_own_select"   on public.users for select  using (auth.uid() = id);
create policy "users_own_insert"   on public.users for insert  with check (auth.uid() = id);
create policy "users_own_update"   on public.users for update  using (auth.uid() = id);
create policy "users_own_delete"   on public.users for delete  using (auth.uid() = id);

-- Friends can read display_name and username
create policy "users_friends_read" on public.users for select using (
  id in (
    select case when requester_id = auth.uid() then addressee_id else requester_id end
    from public.friendships
    where status = 'accepted'
      and (requester_id = auth.uid() or addressee_id = auth.uid())
  )
);

-- ── friendships ──────────────────────────────────────────────

create policy "friendships_own_select" on public.friendships for select using (
  requester_id = auth.uid() or addressee_id = auth.uid()
);
create policy "friendships_own_insert" on public.friendships for insert with check (
  requester_id = auth.uid()
);
create policy "friendships_own_update" on public.friendships for update using (
  requester_id = auth.uid() or addressee_id = auth.uid()
);
create policy "friendships_own_delete" on public.friendships for delete using (
  requester_id = auth.uid() or addressee_id = auth.uid()
);

-- ── workout_signals ──────────────────────────────────────────

create policy "signals_own_all" on public.workout_signals for all using (user_id = auth.uid());

-- Friends can read signals
create policy "signals_friends_read" on public.workout_signals for select using (
  user_id in (
    select case when requester_id = auth.uid() then addressee_id else requester_id end
    from public.friendships
    where status = 'accepted'
      and (requester_id = auth.uid() or addressee_id = auth.uid())
  )
);

-- ── reactions ────────────────────────────────────────────────

-- Own reactions: full access
create policy "reactions_own_all" on public.reactions for all using (from_user_id = auth.uid());

-- Read reactions directed at me
create policy "reactions_to_me_read" on public.reactions for select using (to_user_id = auth.uid());

-- ── challenges ───────────────────────────────────────────────

create policy "challenges_participant_select" on public.challenges for select using (
  challenger_id = auth.uid() or challenged_id = auth.uid()
);
create policy "challenges_challenger_insert" on public.challenges for insert with check (
  challenger_id = auth.uid()
);
create policy "challenges_participant_update" on public.challenges for update using (
  challenger_id = auth.uid() or challenged_id = auth.uid()
);
create policy "challenges_participant_delete" on public.challenges for delete using (
  challenger_id = auth.uid() or challenged_id = auth.uid()
);

-- ── onesignal_subscriptions ──────────────────────────────────

create policy "onesignal_own_all" on public.onesignal_subscriptions for all using (user_id = auth.uid());
