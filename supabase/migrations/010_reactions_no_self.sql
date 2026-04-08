-- ============================================================
-- T&S Muscle — Defensive: no self-reactions
--
-- Belt-and-suspenders check so a user can never react to their own
-- workout signal, regardless of how the client is called. The UI
-- already prevents this path (the friend-activity sheet is never
-- shown for your own signals, and reaction notifications targeting
-- yourself route to the social modal instead via the loop-close
-- logic in _maybeHandlePendingNotifOpen), but the DB should enforce
-- the invariant directly.
-- ============================================================

alter table public.reactions
  add constraint reactions_no_self_check
  check (from_user_id <> to_user_id);
