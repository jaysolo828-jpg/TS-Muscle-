-- Migration 026: store rest/deload week start on the server so the
-- daily challenge-tick cron can fire a "rest week is done" push 7 days
-- after the user entered recovery mode.

alter table public.users
  add column if not exists rest_week_start_at timestamptz default null,
  add column if not exists rest_week_type      text        default null
    check (rest_week_type is null or rest_week_type in ('deload', 'rest'));
