-- ============================================================
-- T&S Muscle — Expand reaction types
-- Adds goat, heart, salute, sparkles to the reaction_type
-- check constraint so the friend-activity sheet can offer
-- a second row of reactions.
-- ============================================================

alter table public.reactions
  drop constraint reactions_reaction_type_check;
alter table public.reactions
  add constraint reactions_reaction_type_check
  check (reaction_type in (
    'thumbs_up',
    'fist_bump',
    'fire',
    'checkmark',
    'goat',
    'heart',
    'salute',
    'sparkles'
  ));
