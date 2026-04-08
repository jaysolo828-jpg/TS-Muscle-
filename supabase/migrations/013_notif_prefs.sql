-- ============================================================
-- T&S Muscle — Notification preferences + quiet hours
--
-- Adds a JSONB column on public.users to store per-type notification
-- preferences and quiet-hours settings. The edge function reads this
-- when looking up recipients for a push and filters them based on
-- the notification type and current local time.
--
-- Shape (all fields optional — missing means "notify on"):
--   {
--     "workout_start":    true | false,   -- friend starts a workout
--     "workout_complete": true | false,   -- friend finishes a workout
--     "reaction":         true | false,   -- someone reacts to my workout
--     "friend":           true | false,   -- friend request / accept
--     "quiet_enabled":    true | false,
--     "quiet_start":      "22:00",        -- HH:mm local
--     "quiet_end":        "06:00",        -- HH:mm local
--     "timezone":         "America/Los_Angeles"
--   }
--
-- Opt-out model: a missing key means "notify" (backwards-compatible
-- with existing users who have no notif_prefs yet).
-- ============================================================

alter table public.users
  add column if not exists notif_prefs jsonb not null default '{}'::jsonb;

-- The existing users_friends_read policy already lets friends SELECT
-- this row, which means friends can see each other's notif_prefs. We
-- don't need a separate policy for the edge function because it runs
-- with the service role key (bypasses RLS). Keep prefs readable by
-- friends for now — if we want to hide them later we can narrow the
-- friends_read policy to exclude the notif_prefs column via a view.
