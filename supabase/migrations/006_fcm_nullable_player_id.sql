-- FCM-only Android rows don't have an OneSignal player ID.
-- Make the column nullable so we can upsert android rows with only an fcm_token.
alter table public.onesignal_subscriptions
  alter column onesignal_player_id drop not null;
