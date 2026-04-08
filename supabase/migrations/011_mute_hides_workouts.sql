-- ============================================================
-- T&S Muscle — Mute also hides workouts
--
-- Previously, muting a friend only silenced the push notification
-- fan-out in the edge function — the friend could still see your
-- workouts whenever they opened your activity sheet. This was
-- surprising: users expect "mute" to mean "hidden" in both senses.
--
-- This migration updates the signals_friends_read RLS policy on
-- workout_signals so that a friend B is blocked from reading user
-- A's workouts whenever A has a row in workout_notif_mutes with
-- muter_id = A and muted_friend_id = B. The existing friendship
-- requirement is preserved.
--
-- Own-row access (via signals_own_all) is unaffected — A can always
-- read their own signals regardless of mutes. The edge function's
-- push filter still works on top of this (belt and suspenders).
-- ============================================================

drop policy if exists "signals_friends_read" on public.workout_signals;

create policy "signals_friends_read" on public.workout_signals for select using (
  user_id in (
    select case when requester_id = auth.uid() then addressee_id else requester_id end
    from public.friendships
    where status = 'accepted'
      and (requester_id = auth.uid() or addressee_id = auth.uid())
  )
  and not exists (
    select 1 from public.workout_notif_mutes m
    where m.muter_id = workout_signals.user_id
      and m.muted_friend_id = auth.uid()
  )
);
