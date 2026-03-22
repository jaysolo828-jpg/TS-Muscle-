-- ============================================================
-- T&S Muscle — Workout Notifications
-- Phase 2: thumbs_up reaction, unique constraints for
--           idempotent reactions and subscriptions.
-- ============================================================

-- Add thumbs_up to the reaction_type check constraint
alter table public.reactions
  drop constraint reactions_reaction_type_check;
alter table public.reactions
  add constraint reactions_reaction_type_check
  check (reaction_type in ('thumbs_up', 'fist_bump', 'fire', 'checkmark'));

-- One reaction per user per signal (prevents duplicate reactions)
alter table public.reactions
  add constraint reactions_unique_per_signal
  unique (from_user_id, signal_id);

-- One subscription per user per platform
alter table public.onesignal_subscriptions
  add constraint onesignal_unique_per_platform
  unique (user_id, platform);
