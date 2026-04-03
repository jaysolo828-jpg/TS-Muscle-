-- Add unique constraint on (user_id, platform) so the FCM token upsert works.
-- Without this constraint, the ON CONFLICT clause in _saveFcmToken() silently
-- fails and FCM tokens are never stored, forcing all Android notifications
-- through web push without TWA delegation (Chrome icon shows instead of app icon).

-- Remove duplicate rows first, keeping the most recently created row per (user_id, platform).
delete from public.onesignal_subscriptions
where id not in (
  select distinct on (user_id, platform) id
  from public.onesignal_subscriptions
  order by user_id, platform, created_at desc
);

-- Now add the unique constraint.
alter table public.onesignal_subscriptions
  add constraint onesignal_subscriptions_user_platform_unique
  unique (user_id, platform);
