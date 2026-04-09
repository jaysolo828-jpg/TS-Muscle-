# TS Muscle — Session Handoff: Don't Break the Chain Challenge
**Branch:** `claude/limit-recent-sessions-ajkjh`
**Date:** April 2026
**Status:** Built, committed, pushed. Pending merge + Supabase deploys.

---

## What the User Asked For

A complete "Don't Break the Chain" challenge type added alongside the existing 1RM challenge. Full spec:

- A challenge picker card in the friends tab (replaces old CHALLENGES header + 1RM button) — tapping it slides up a picker to choose challenge type
- Each challenge type has its own color: **1RM = brand red (#C0392B)**, **Chain = electric blue (#3B82F6)**, launcher card = neutral cream (scalable for future types)
- Multi-step chain create flow: invite crew → settings (Strict/One Strike, duration) → weekly target → confirm
- Accept flow for invitees (each sets their own weekly session target)
- Detail sheet with dot grid (member-colored dots per training day), pace status per member, at-risk alerts, action buttons
- Home screen card in electric blue showing DAY X / TOTAL, last 7 days of dots, pace label
- Adaptive push notifications: invite, accept, week complete, strike used, chain broken, chain survived, at-risk mid-week alerts
- AT RISK ALERTS: in-sheet label "Needs X more sessions in Y days" + Wednesday push notification
- RUN IT BACK: button on completed chain detail that re-challenges the same crew with same settings, skipping straight to confirm

**Additional changes made this session:**
- Launcher card redesigned to be neutral (cream top border, "Tap to choose a challenge type") so each challenge type owns its own color identity
- Full readability + polish audit across all challenge UI elements
- Intro sheet color-aware (blue for chain, red for 1RM — border, bullets, CTA)
- Chain detail close button fixed (was disappearing after loading skeleton replaced)
- Accept sheet made consistent with other sheets (background, max-width, z-index, tap-outside-to-close)
- 9px font sizes bumped to 11px throughout chain UI
- "0 others in chain" → "waiting on others"
- Step indicators added to all 4 create steps

---

## Supabase: What Must Be Deployed

### 1. Migration 019 — Run in Supabase SQL Editor BEFORE merge

```sql
ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_challenge_type_check
    CHECK (challenge_type IN ('one_rep_max', 'dont_break_chain'));

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS chain_mode         text    CHECK (chain_mode IN ('strict', 'one_strike')),
  ADD COLUMN IF NOT EXISTS chain_days         int     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chain_broken_by_ids uuid[] DEFAULT '{}';

ALTER TABLE public.challenge_participants
  ADD COLUMN IF NOT EXISTS weekly_target int,
  ADD COLUMN IF NOT EXISTS dot_color     text,
  ADD COLUMN IF NOT EXISTS weeks_hit     int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weeks_total   int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.chain_weeks (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id     uuid        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  week_number      int         NOT NULL,
  week_start       timestamptz NOT NULL,
  week_end         timestamptz NOT NULL,
  evaluated_at     timestamptz NOT NULL DEFAULT now(),
  chain_survived   boolean     NOT NULL,
  missed_user_ids  uuid[]      NOT NULL DEFAULT '{}',
  forgiven_user_id uuid,
  UNIQUE (challenge_id, week_number)
);

ALTER TABLE public.chain_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY chain_weeks_participant_select ON public.chain_weeks
  FOR SELECT
  USING (public.ts_user_is_challenge_participant(challenge_id));
```

### 2. Edge Function — Paste into Supabase Dashboard → Functions → challenge-tick → Edit

File is at: `supabase/functions/challenge-tick/index.ts`

Key changes from the previous version:
- Phase B (auto-start/cancel) now handles BOTH challenge types (previously filtered to one_rep_max only)
- Phase D added: Chain weekly evaluation (Mon–Sun UTC weeks, Strict vs One Strike, chain_weeks table, weeks_hit/total update, pushes)
- Phase E added: Wednesday at-risk push alerts to behind-pace chain members

---

## Files Changed This Session

### `index.html`
All changes are web-side. No native build required.

**HTML (static, around line 8470):**
- Replaced old "START A 1RM CHALLENGE" button with a neutral launcher card that opens `_openChallengePicker()`
- Launcher has cream top border (not blue or red — scalable for future challenge types)

**New JavaScript functions added** (inserted after `_renderActiveChallengeHomeCard`, before `_submitChallengeLog`):

| Function | Purpose |
|---|---|
| `_CHAIN_MAX_INVITEES` | Constant = 7 |
| `_CHAIN_DOT_COLORS` | 8-color palette for member dot assignment |
| `_openChallengePicker()` | Two-tile picker sheet (1RM red, Chain blue) |
| `_startNewChainChallenge()` | Entry point, checks intro dismissal |
| `_openNewChainChallengeFlow()` | Creates sheet with blue border, initializes draft |
| `_renderChainCreateStep()` | Routes to correct step HTML based on `_challengeDraft.step` |
| `_chainFriendPickerHtml()` | Step 1: friend list with checkboxes, up to 7 |
| `_renderChainFriendList()` | Async: fetches friends and renders picker rows |
| `_onChainFriendToggle(userId)` | Toggle friend selection, enforce max |
| `_refreshChainFriendPickerUi()` | Updates counter + CONTINUE button state |
| `_onChainFriendContinue()` | Advance to settings step |
| `_chainSettingsHtml()` | Step 2: Strict/One Strike mode + 4/6/8/12 week duration |
| `_onChainModeSelect(mode)` | Mode tile selection UI |
| `_onChainDurSelect(weeks)` | Duration tile selection UI |
| `_onChainSettingsContinue()` | Advance to target step |
| `_chainTargetHtml()` | Step 3: weekly session target tiles (2–6) |
| `_onChainTargetSelect(t)` | Target tile selection UI |
| `_onChainTargetContinue()` | Advance to confirm step |
| `_chainCreateConfirmHtml()` | Step 4: summary card — mode, duration, target, invited |
| `_submitNewChainChallenge()` | DB insert (challenges + participants), invite pushes |
| `_openAcceptChainFlow(challengeId)` | Accept sheet for invitees |
| `_renderChainAcceptStep(ch, defaultTarget)` | Target picker in accept flow |
| `_onChainAcceptTargetSelect(t)` | Accept flow target tile UI |
| `_submitAcceptChain()` | Update participant row to joined, push creator |
| `_chainPaceStatus(done, target, dayOfWeek)` | Returns `{ label, color }` — DONE / AHEAD / ON TRACK / ONE BEHIND / FALLING BEHIND |
| `_renderChainDetailBody(ch)` | Async: dot grid + pace rows + at-risk alerts + action buttons |
| `_buildDotGrid(ch, workoutsByUser, dotColorById, dayElapsed, joined, nameById)` | Scrollable horizontal grid: member rows × day columns |
| `_renderActiveChainHomeCard()` | Synchronous home card: DAY X, last 7 dots from state.history, pace label |
| `_chainRowHtml(c)` | Active/pending chain row in challenges list |
| `_pastChainRowHtml(c)` | Completed chain row (SURVIVED / BROKEN chip) |
| `_runItBack(challengeId)` | Pre-fills draft with same settings + crew, opens create sheet at confirm |

**Modified existing functions:**

| Function | Change |
|---|---|
| `_openChallengeDetailSheet` | Type-dispatches to `_renderChainDetailBody` for chain type; sets blue border-top |
| `_refreshChallengeDetailSheet` | Same type dispatch |
| `_renderActiveChallengeHomeCard` | Filters to `challenge_type !== 'dont_break_chain'` |
| `_renderChallengesListHtml` | Dispatches to `_chainRowHtml` / `_pastChainRowHtml` for chain rows |
| `_openChallengeIntroSheet` | Now color-aware: blue accent for chain, red for 1RM (border, bullet headers, CTA button) |
| All `_renderActiveChallengeHomeCard` call sites | Also call `_renderActiveChainHomeCard()` immediately after |

### `supabase/functions/challenge-tick/index.ts`
- Phase B: removed `challenge_type=eq.one_rep_max` filter so chain challenges also auto-start/cancel
- Phase D: full chain weekly evaluation (new)
- Phase E: Wednesday at-risk alerts (new)

### `supabase/migrations/019_chain_challenge.sql`
New file. SQL is above. Must be applied to Supabase before the code goes live.

---

## Architecture Notes for Next Claude

### Don't Break the Chain — How It Works

**DB tables involved:**
- `challenges` — `challenge_type = 'dont_break_chain'`, `chain_mode` ('strict'|'one_strike'), `chain_days`, `chain_broken_by_ids` (uuid[])
- `challenge_participants` — `weekly_target` (int, per-member), `dot_color` (text, from palette), `weeks_hit`, `weeks_total`
- `chain_weeks` — one row per evaluated week per challenge. `chain_survived` bool, `missed_user_ids`, `forgiven_user_id`. Protected by RLS via `ts_user_is_challenge_participant` SECURITY DEFINER helper (same pattern as 1RM challenges — see migration 018).
- `workout_signals` — queried server-side for the dot grid and weekly evaluation. Any `signal_type IN ('started','completed')` counts as a session day.

**Dot colors:**
Creator gets `_CHAIN_DOT_COLORS[0]`, invitees get subsequent indices. On accept, the client assigns the next palette color not already in use by joined participants. Palette = `['#3B82F6','#2ecc71','#D4A843','#E74C3C','#9B59B6','#1ABC9C','#F39C12','#EC407A']`.

**Weekly target:**
Creator sets the default during create. Each invitee can override their own target when they accept. The target is per-participant row, not per-challenge.

**Strict vs One Strike:**
- Strict: any `missed_user_ids.length > 0` at week-end breaks the chain.
- One Strike: first week with a miss is forgiven (`forgiven_user_id` = first missed user, `chain_survived = true`). If `strikeUsed` (any prior `chain_weeks` row has a non-null `forgiven_user_id`), a subsequent miss breaks it.

**Week boundaries:**
Week 1 starts on the first Monday on or after `challenge.start_date` (UTC). The edge function calculates `firstMonMs` from `start_date`. Weeks are Mon 00:00 UTC → Sun 23:59 UTC.

**AT RISK ALERTS:**
- In-sheet: `_renderChainDetailBody` pace rows show red alert line "Needs X more sessions in Y days" when pace label is ONE BEHIND or FALLING BEHIND.
- Push: edge function Phase E fires every Wednesday UTC to any behind-pace member. Fires once per week on a daily cron.

**RUN IT BACK:**
- Button appears in `_renderChainDetailBody` when `ch.status === 'completed'`
- `_runItBack(challengeId)` pre-fills `_challengeDraft` with same mode/duration/target + all previously joined/left participants as friendIds, then opens the create sheet at the `confirm` step
- Users see a summary before launching, then `_submitNewChainChallenge()` runs normally

**Home card:**
`_renderActiveChainHomeCard()` is synchronous — uses `state.history` for current user's dots (no fetch). Shows DAY X / TOTAL days, last 7 days as dots in the user's assigned color, pace label. Inserted before `#deload-banner` same as 1RM card. Cleaned and re-rendered at all the same call sites as `_renderActiveChallengeHomeCard`.

**Deep link:**
Chain challenge push notifications use the same `sid: "c:" + challengeId` prefix as 1RM challenges. Client-side `_maybeHandlePendingNotifOpen` detects the prefix and routes to `_openChallengeDetailSheet` which then dispatches to `_renderChainDetailBody` based on `challenge_type`.

---

## RLS Pattern — Do Not Break

All challenge RLS policies use the `ts_user_is_challenge_participant(uuid)` SECURITY DEFINER helper (created in migration 018). This breaks the recursion cycle that Postgres rejects at plan time. The `chain_weeks` table uses the same helper for its SELECT policy. If you add new RLS on `challenges`, `challenge_participants`, or `chain_weeks`, always call the helper — do not write inline EXISTS subqueries against these tables.

---

## What Is NOT Built (Deferred)

- Stats tab integration for chain challenges (user asked about it, no decision made)
- Creator removing inactive members mid-challenge (user mentioned it, not implemented)
- Dot grid does not show a date axis (just day indices) — could be added later
- At-risk alerts only fire on Wednesday — no per-member throttling beyond that; if cron runs multiple times on Wednesday, multiple pushes could fire (acceptable trade-off)

---

## Deploy Checklist

- [ ] Run migration 019 SQL in Supabase SQL Editor
- [ ] Paste updated `challenge-tick/index.ts` into Supabase dashboard (verify JWT = OFF)
- [ ] Merge `claude/limit-recent-sessions-ajkjh` → main
- [ ] Netlify auto-deploys web changes (~1 min after merge)
- [ ] No native Android build required — all changes are web-side

---

## Commit History This Session

```
42e3d3d  Build AT RISK ALERTS and RUN IT BACK for chain challenges
b56011d  Readability and polish pass on all challenge UI elements
333678e  Launcher card: neutral cream accent, no challenge-type color
2dc26d6  Differentiate challenge launcher card from chain challenge cards
8efcfe9  Fix: chain create sheet uses correct id 'challenge-create-sheet' on dismiss
ab3ecda  Add Don't Break the Chain challenge type
```
