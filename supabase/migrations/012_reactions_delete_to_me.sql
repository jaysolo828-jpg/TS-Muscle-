-- ============================================================
-- T&S Muscle — Let recipients delete reactions directed at them
--
-- Previously only the sender (from_user_id = auth.uid()) could delete
-- a reaction row, via reactions_own_all. Recipients could read
-- reactions to them via reactions_to_me_read but not remove them from
-- their own "Recent reactions" list in the social modal.
--
-- Adds a dedicated delete policy so the recipient (to_user_id) can
-- remove reactions that were directed at them. This is a unilateral
-- action on the recipient's side — it does NOT change the sender's
-- view of reactions they sent (which uses reactions_own_all and
-- would still see the row gone because it actually disappears from
-- the table; there's no "soft delete" here).
-- ============================================================

create policy "reactions_to_me_delete"
  on public.reactions
  for delete
  using (to_user_id = auth.uid());
