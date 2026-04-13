-- 024_subscription.sql
-- Add subscription tracking columns to the users table.
--
-- trial_start_at defaults to now() so existing users (current testers)
-- get a fresh 14-day trial from the date this migration is applied.
-- New users have trial_start_at set explicitly in the upsert.
--
-- subscription_status values:
--   'trial'     — within the 14-day free trial window
--   'active'    — paid Google Play subscription confirmed
--   'expired'   — trial ended, no active subscription
--   'cancelled' — subscription was cancelled by user
--
-- Apply this migration in Supabase SQL Editor BEFORE merging billing code.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS trial_start_at       timestamptz  DEFAULT now(),
  ADD COLUMN IF NOT EXISTS subscription_status  text         DEFAULT 'trial'
    CONSTRAINT users_subscription_status_check
      CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  ADD COLUMN IF NOT EXISTS subscription_sku     text;
