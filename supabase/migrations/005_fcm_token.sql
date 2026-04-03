-- Add FCM token column for Android native push notifications
alter table public.onesignal_subscriptions
  add column if not exists fcm_token text;
