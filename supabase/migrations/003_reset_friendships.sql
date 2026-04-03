-- ============================================================
-- Reset all friendship data
-- Run this in the Supabase SQL editor (requires elevated privileges
-- to bypass RLS). All users will need to re-add each other.
-- ============================================================

truncate table public.friendships;
