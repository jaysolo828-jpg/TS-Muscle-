# TS Muscle — Handoff Notes for Claude

Read this first. It captures the architecture, user preferences, and the
parts of the codebase that are fragile because of hard-won debugging.
Do not break the things listed under "Critical — do not regress."

---

## What this project is

**TS Muscle** is a hypertrophy/workout tracking app. It ships as:

- A **Trusted Web Activity (TWA)** Android app that wraps the website at
  `https://app.therapyandsneakers.org`. The native shell lives in `android/`
  and is built manually via GitHub Actions.
- The **website itself** (`index.html`, `sw.js`, assets) deploys
  automatically via Netlify whenever `main` updates. No build step for
  web changes — push to main, Netlify redeploys, done.
- A **Supabase** backend (auth, social features, friend/workout
  notifications) with an edge function at `supabase/functions/send-push/`
  that fans out push notifications.

The Android package name is `io.github.jaysolo828_jpg.twa`.

---

## User's working style — respect these

1. **Prefer web-side fixes.** The user can push to main, Netlify redeploys,
   done. This is the normal dev loop. **Do not drag work into the native
   Android shell unless there is no web-side path.** Every native change
   forces a manual AAB build → Play Console upload → Internal Testing
   rollout → phone update, which the user dislikes.
2. **Native builds are fine when necessary.** The user is not anti-build;
   they are anti-"every fix requires a build." If the only correct fix
   lives in native Kotlin or the manifest, say so, and bundle as much as
   possible into a single build to minimize cycles.
3. **Be direct and short.** Lead with the fix, not the reasoning. Don't
   hedge with "some versions" or "might" when you actually know — say so
   plainly, and when you genuinely don't know, say that too.
4. **Don't claim merges you didn't actually complete.** Push to the
   feature branch (currently `claude/fix-repo-connection-WsbVp`) and let
   the user merge. They've asked not to see "merged!" messaging unless
   truly merged.
5. **Don't add features, comments, or refactors beyond the task.** The
   user is tired of scope creep.

---

## Critical — do not regress

These areas took many painful sessions to get right. Before touching
anything in this list, reread the section.

### 1. FCM token race in `android/app/src/main/kotlin/io/github/jaysolo828_jpg/twa/MainActivity.kt`

On fresh install, `SharedPreferences` has no cached FCM token, so
`getLaunchingUrl()` would launch without `?fcm_token=...`, the web page
never registers the native token with Supabase, and all notifications
fall back to web push (rendered as Chrome notifications with the origin
URL on the card — visually broken).

**Fix in place (do not remove):** `onCreate()` has a branch on cached
token presence. On first launch only, it **synchronously blocks** the
main thread on a `CountDownLatch` (with a 1.5s timeout and background
`Executor` to avoid deadlock) waiting for `FirebaseMessaging.getInstance().token`
before calling `super.onCreate()`. On subsequent launches, it reads
the cached token and refreshes asynchronously without blocking — do NOT
re-introduce blocking on every launch, it causes a visible splash/hang.

### 2. Notification permission — the native bridge activity

**The problem:** On Android 13+, Chrome's per-origin notification
permission and Android's app-level `POST_NOTIFICATIONS` are two separate
permissions. Users can end up in a split state where
`Notification.permission === 'granted'` at the Chrome level but
`POST_NOTIFICATIONS` is denied at the OS level. From JavaScript alone,
there is **no** API to trigger a real OS prompt in that state —
`Notification.requestPermission()` is a no-op because Chrome thinks
everything is already granted. This was the cause of multiple sessions'
worth of "why aren't notifications working" debugging.

**Fix in place (ships in 1.0.3.1 / versionCode 40):**

- **`android/app/src/main/kotlin/io/github/jaysolo828_jpg/twa/EnableNotificationsActivity.kt`** —
  tiny native bridge activity that calls
  `ActivityCompat.requestPermissions(POST_NOTIFICATIONS)` and finishes.
  Extends plain `android.app.Activity` (not `AppCompatActivity` — the
  project does not depend on `androidx.appcompat`; do not add it).
- **`AndroidManifest.xml`** declares it with an intent-filter on a
  custom scheme: `ts-muscle-enable-notifs`. Includes `VIEW` action,
  `DEFAULT` and `BROWSABLE` categories.
- **`index.html`** `_triggerNativePermissionPrompt()` launches the
  activity via Chrome's `intent://` URL format:
  ```
  intent://prompt#Intent;scheme=ts-muscle-enable-notifs;package=io.github.jaysolo828_jpg.twa;end
  ```
  Plain `window.location.href = 'ts-muscle-enable-notifs://prompt'`
  does **not** work inside a Chrome Custom Tab (silently dropped). Do
  not revert to the plain scheme URL.

### 3. Notification sheet (`_showNotifSheet` in `index.html`)

- **`localStorage.notifSheetShown` is the dismissal flag.** Originally
  this was `sessionStorage` which cleared every app restart, causing
  the sheet to pop up on every refresh for users with working
  notifications. Switched to `localStorage` so the dismissal persists
  across launches. **Do not switch back to sessionStorage.**
- **NOT NOW always sets the flag** (permanent dismissal). The user can
  re-trigger the sheet by toggling social features off/on in settings —
  `toggleSocialFeatures` is the ONLY automatic clearing path and it
  removes from `localStorage`.
- **ENABLE only sets the flag when `Notification.permission === 'granted'`
  at click time.** The inline onclick reads:
  ```js
  if(Notification.permission==='granted')localStorage.setItem('notifSheetShown','1');document.getElementById('notif-prompt-sheet')?.remove()
  ```
  Reason: if permission isn't already granted, we want a fat-fingered
  "Don't allow" on the OS dialog to be recoverable — the sheet returns
  on next app open. If permission IS already granted (working user or
  split-brain user who just succeeded), persist the dismissal so we
  don't pester them again.
- **Do not set the flag at render time** — a service-worker
  `controllerchange` reload will wipe the DOM and the post-reload
  attempt will bail out because the flag is set.
- **z-index is `999999`** — the app has dozens of modals at `99999`
  which would visually cover a lower sheet. Do not lower it.
- **The sheet shows in all three permission states** (`default`,
  `denied`, `granted`) — blocking on `granted` hides the sheet for
  users in the split-permission state. We rely on the `localStorage`
  persistence + the conditional ENABLE logic to keep working users
  from being pestered, instead of an early return on `granted`.
- **`_requestNotificationPermission` does not early-return on `denied`
  or `granted`** — both still call `_maybeShowNotifSheet` so the user
  can see and recover.
- **`_promptNotifsForSocial` (called when opening the social modal)
  also checks `localStorage.notifSheetShown`** before showing the
  sheet. Without this check, a user who tapped NOT NOW would see the
  sheet again every time they opened the social modal in a new session.
- **`_onNotifSettingsTap` denied toast is platform-aware** — shows an
  Android/iOS/desktop-specific message based on user agent. Don't
  hardcode "Android Settings" again.

### 4. Page-side FCM token handoff

`index.html` reads `?fcm_token=` from the URL once at parse time via an
IIFE and stashes it in `window._fcmToken`. `_saveFcmToken` is called
from the IIFE (early return if Supabase auth not yet ready) and again
from `_onSupabaseSignIn` (line ~7890) once the user ID is available.
Do not rearrange this dance — the double-call is intentional because
Supabase auth is async.

`_registerOneSignalPlayerId` awaits `_waitForFcmTokenIfAndroid(800)`
before saving the push subscription, so the first-ever subscription row
contains `fcm_token` and delivery goes native from the start.

### 5. Notification deep link → friend reactions sheet

When a user taps a workout notification, the app deep-links into the
friend-activity sheet for that specific workout signal so they can
react. Three pieces have to stay in sync:

**Android (`TSFirebaseMessagingService.kt`)** — the PendingIntent URL
is built from the FCM data with `to_user_id` and `signal_id` query
params:
```kotlin
val tapUri = Uri.parse("https://app.therapyandsneakers.org/")
    .buildUpon()
    .apply {
        if (!toUserId.isNullOrEmpty()) appendQueryParameter("open_friend", toUserId)
        if (!signalId.isNullOrEmpty()) appendQueryParameter("signal_id", signalId)
    }
    .build()
```
`MainActivity.getLaunchingUrl()` then composes cleanly via its own
`buildUpon().appendQueryParameter("fcm_token", token)`. Don't break
this — the existing fcm_token append is what the page needs to
register native FCM.

**Service worker (`sw.js`)** — the default `notificationclick` handler
builds the same query params for new windows AND postMessages
`{type: 'OPEN_FRIEND_ACTIVITY', to_user_id, signal_id}` to existing
same-origin clients (the iOS/desktop focus-existing-window case).
Android TWA reloads the URL via the Intent so doesn't need the
postMessage path.

**Page (`index.html`)** — there's an IIFE inside the init `try` block
(immediately after `loadState()`, BEFORE `renderHome()`) that reads
`?open_friend=` / `?signal_id=`, stores them in `sessionStorage`, then
cleans the URL via `history.replaceState`. It calls
`_maybeHandlePendingNotifOpen()` synchronously so the friend-activity
sheet can be in the DOM before the home screen even paints.

`_maybeHandlePendingNotifOpen()` is intentionally **not async** — it
fires `_openFriendActivity()` which creates and appends the sheet
synchronously before its first await. Don't add awaits to this
function or the home-screen-flash bug returns. The friend cache warm
is done as a parallel third query inside `_openFriendActivity`'s
existing `Promise.all` (alongside `workout_signals` and `reactions`),
and the header is updated in place via `#friend-activity-header`
when the user data arrives.

`_openFriendActivity` accepts an optional `signalId` second parameter.
When provided (notification deep link), it queries `eq('id', signalId)`
to fetch the exact signal — without it (normal friends-list tap) it
falls back to "most recent" which can be the wrong workout if the
friend has logged another since the notification was sent.

The session-restore path of `_checkSupabaseSession` ALSO calls
`_maybeHandlePendingNotifOpen()` as a fallback, in case
`state.supabaseUserId` wasn't loaded synchronously from localStorage
on the IIFE pass. Both calls are idempotent (sessionStorage is cleared
on first handle).

### 6. Reaction-notification loop-close (do not break)

When B reacts to A's workout, A receives a "B reacted to your workout"
notification. The notification's deep link carries `to_user_id = A`
(the workout owner = the recipient), but **no `signal_id`** because
the reaction notification doesn't reference a workout signal. Without
the loop-close logic in `_maybeHandlePendingNotifOpen`, tapping that
notification would call `_openFriendActivity(A)` which fetches A's own
most-recent workout signal and shows the reaction buttons — letting A
react to themselves. The loop never closes.

**Fix in place:** before calling `_openFriendActivity`, check:
```js
if (pending.userId === state.supabaseUserId || !pending.signalId) {
  // Open social modal instead, deferring to DOMContentLoaded if needed.
}
```
The check is OR'd: either condition (target is self, or signal_id is
missing) routes to the social modal. Both conditions catch reaction
notifications. The userId-equals-self condition is also a defensive
catch for any other notification accidentally pointing to the user.

The social modal path appends a placeholder dark backdrop to body
during the init script (z-index 900, matches `.lib-overlay`) because
`#social-overlay` lives at line ~30336 in the static HTML, AFTER the
closing `</script>` tag — so during the init-time call it doesn't
exist yet and `openSocialModal()` would no-op. The placeholder
prevents a home-screen flash while we wait for `DOMContentLoaded`,
then is removed when the real modal opens. **If you change where
`#social-overlay` lives in the HTML, this placeholder dance can be
simplified.**

### 7. Never write `</scr` + `ipt>` literally inside a JS comment

The HTML parser is greedy and doesn't care if `</scr` + `ipt>` is
inside a JavaScript `//` comment, a string, or a template literal —
when it sees those characters in script content it ends the script
tag right there, then parses the rest of the file (including the
remaining JS) as plain text. The user will see raw code on screen.

**This happened once already.** A code comment in
`_maybeHandlePendingNotifOpen` referenced "the closing `</scr` + `ipt>`
tag" and bricked the entire app. Fixed in commit `cd9ef5b`.

If you need to write this literal text in JS (comments, strings, etc.),
break it up as `'<\/scr' + 'ipt>'` or `'</scri' + 'pt>'` or just rephrase
so the literal characters never appear. Same goes for any multiline
string, template literal, or `innerHTML` content.

### 8. The notification small icon on Samsung Note 20 (abandoned)

There is a visible "white square" behind the full-color notification
small icon on Galaxy Note 20 and similar Samsung devices running One UI
5–6. This is a **Samsung One UI system-level rendering quirk** affecting
Android 13/14 Samsung phones that have not yet received One UI 7+.
**There is no app-side fix.** We researched this thoroughly and tried
density-specific variants (still in `drawable-mdpi/.../drawable-xxxhdpi/
ic_ts_notification.png`), `.setColor()`, compositing transparent corners,
etc. Nothing works. Users on affected phones will see the white square
until their phone gets One UI 7+. Do not reopen this unless you have
truly new information — the user is done with it.

### 9. Per-friend workout mute (do not regress)

A user can mute individual friends from seeing their workouts. "Mute"
means BOTH "no push notification fires to them" AND "they can't see
the workout at all in the app" — not just silencing the push. Three
independent pieces enforce this, all must stay in sync:

- **`workout_notif_mutes` table** (migration 009):
  ```sql
  (muter_id, muted_friend_id, created_at)
  ```
  Primary key on `(muter_id, muted_friend_id)`. RLS policy
  `mutes_own_all` — a user can only read/write their own rows.
  `CHECK (muter_id <> muted_friend_id)` prevents self-mute.

- **Edge function filter** in `supabase/functions/send-push/index.ts`.
  The workout fan-out path (`if (to_uid) { ... } else { ... }`)
  fetches `workout_notif_mutes` for the sender in parallel with the
  friendships expansion and filters the targets list. The `to_uid`
  direct-send path (reactions, friend requests) does NOT filter —
  those are personal recipient-targeted notifications, not fan-out.

- **RLS policy `signals_friends_read`** (migration 011) has a
  `NOT EXISTS` subquery against `workout_notif_mutes` so muted
  friends can't even SELECT the signal row. Without this, a muted
  friend would still see the workout when they open your activity
  sheet — push-silencing alone is not enough.

Page-side state:
- `_mutedFriends` (Set) at module level, populated from the DB via
  `_loadFriendsList` in parallel with the users fetch (no extra
  round-trip).
- `_toggleWorkoutMute` does optimistic UI flip + DB upsert/delete,
  reverts + toasts on error. Targeted DOM update on the friend-row
  actions container (`#friend-row-actions-{userId}`) to show/hide
  the bell-off SVG — no re-fetch, no re-render.
- Toggle UI lives in `_openFriendActivity` above REMOVE FRIEND.
- Toggle label: **"SHARE WORKOUTS WITH THEM"**
  - ON sub: "They see your workouts and know when you start"
  - OFF sub: "Hidden — they won't see any of your workouts"
- `_BELL_OFF_SVG` and `_CHEVRON_SVG` are module-level constants so
  both the initial render and the in-place update can reach them.

### 10. Per-type reaction push gate + signal dedup

Two separate dedup mechanisms, both matter. **Do not conflate them.**

**Signal-side dedup (`_sendWorkoutSignal`):** When a user starts a
workout, check for an existing `signal_type = 'started'` row for the
same `(user_id, workout_name)` within the last 2 hours. If found,
reuse its id (`_currentSignalId = recent[0].id`) instead of
inserting a new row. Keeps reactions accumulating on one signal row
across abandoned-then-restarted sessions so the Today's Reactions
single-card view can display them correctly.

**But always fire the friend push notification**, whether the signal
was reused or freshly inserted. In an earlier version I early-returned
on reuse, which made notifications silently stop firing whenever a
user started a workout within 2 hours of a previous start —
catastrophic UX bug ("notifications broke"). The fix is to split the
two concerns: dedup the DB row, always notify friends. Trade-off:
friends get two "in the gym" pushes if the user abandons and restarts
within 2 hours — preferable to pushes silently not firing.

**Per-type reaction push gate (`_sendReaction`):** Module-level state
tracks per-signal reaction history:
```js
const _signalReactionState = {};
// { [signalId]: { current: 'fire' | null, pushed: Set<string> } }
```
Populated in `_openFriendActivity` from the existing `myRxns` query
(cleared and rebuilt on every sheet open). On tap:

- **Same type as `current`** → total no-op. Skip the DB upsert
  entirely (the row is already in the DB with this type). Still run
  the optimistic visual flip and the status line pulse so the tap is
  acknowledged, but no network round-trip and no push.
- **Different type** → upsert the row (updates `reaction_type`),
  update `signalState.current = reactionType`. Then check the
  `pushed` Set: if this reaction type has already fired a push this
  session for this signal, skip the push. Otherwise add to the Set
  and fire the push.

Net effect: each unique reaction type fires exactly one push per
signal per session. Toggling 👍 → 🔥 → 👍 → 🔥 fires two pushes (one
when 👍 is first sent, one when 🔥 is first sent), then stays silent.
Max 8 pushes per signal per sender (one per reaction type). Re-taps
of the same current type are completely free (no DB, no push).

### 11. Today's Reactions is today-only, single card — no history feed

`_loadRecentReactions` is NOT a history view. It queries the user's
most recent `workout_signals` row scoped to today (local midnight)
and shows reactions on that ONE signal. If no signal today → section
hidden. If signal but no reactions → section hidden. There is never
more than one card.

**Do not add grouping or pagination.** An earlier version grouped by
signal_id and rendered up to 5 workout cards. The user rejected this
as overwhelming ("I don't see the need to see reactions for any other
workout except for the day of only"). The single-card approach is
deliberate.

Section title is **"TODAY'S REACTIONS"**, not "RECENT REACTIONS" —
don't revert the label.

Chip structure: each reactor is a two-button pill inside the card.
- Left half (avatar + emoji badge, 36×36 tap target): tap → open the
  reactor's activity sheet via `_openFriendActivity(reactorId)` with
  NO `signal_id` argument. Earlier versions passed `signal_id`, which
  rendered the current user's own workout inside the reactor's sheet
  and let them cross-wire a self-reaction (loop never closed). Don't
  pass signal_id from this chip.
- Right half (brand-red ✕, 28×36 tap target): tap → open the single-
  reaction confirm sheet (`_confirmRemoveSingleReaction`).

Card header has a trash icon for bulk clear (`_confirmClearReactions`
→ `_clearReactionsForSignal`). Both delete paths require migration
012's `reactions_to_me_delete` RLS policy to actually work.

`_recentReactionsCache` at module level stores per-reaction context
(label/emoji/workoutName/signalId) so the confirm sheet can look up
the descriptive message without interpolating user-controlled strings
into inline onclick attributes (double-escape hell). The onclick only
carries the reaction UUID, which is always safe.

### 12. Friend activity sheet: `.limit(1)` is intentional

`_openFriendActivity` has two paths for its `signalsQuery`:
- **With `signalId` (deep-link)**: `.eq('id', signalId).limit(1)` —
  fetches the exact signal the notification pointed at.
- **Without `signalId` (normal friends-list tap)**: `.limit(1)` on
  the most recent signal only.

Both are capped at 1. An earlier version used `.limit(10)` on the
normal path to let users react to any of a friend's recent workouts.
The user rejected it as overwhelming — "it should still just show the
current one only... this is inside the card not on the friends home
screen." Don't re-expand the limit.

### 13. Friend requests fire push notifications

`_sendFriendRequest` fires a push to the recipient via the `to_uid`
direct-send path immediately after the DB insert succeeds. Uses
`bright-processor` edge function with:
```js
{ to_uid: addresseeId, title: `${fromName} wants to be your friend`,
  body: 'Tap to accept or decline.', avatar_url: state.supabaseAvatarUrl }
```
The mute filter does NOT apply (direct-send `to_uid` path). Recipients
see the request instantly instead of waiting on the 60-second social
dot poll. Cancel flow exists via `_cancelFriendRequest` — the search
result button flips between "ADD FRIEND" and "CANCEL" based on the
`_outgoingFriendRequests` map populated on social-modal open.

### 14. Notification preferences (per-type + quiet hours)

Stored in `public.users.notif_prefs` (jsonb, migration 013). Shape:
```json
{
  "workout_start": true, "workout_complete": true,
  "reaction": true, "friend": true, "challenge": true,
  "quiet_enabled": false, "quiet_start": "22:00", "quiet_end": "06:00",
  "timezone": "America/New_York"
}
```
Opt-out model: missing keys default to "notify".

- Client: `_getDefaultNotifPrefs`, `_loadNotifPrefs`, `_saveNotifPrefs`,
  `_openNotifPrefsSheet`, `_toggleNotifPref`, `_setNotifQuietTime` in
  `index.html`. Entry point is the Notifications row in Settings.
- Every push call site passes a `type` field in the `bright-processor`
  request body. Valid values: `workout_start`, `workout_complete`,
  `reaction`, `friend`, `challenge`. Missing type defaults server-side
  to `workout_start` for backwards compat.
- `supabase/functions/send-push/index.ts` has `isInQuietHours()` and
  `shouldNotify()` helpers. It fetches each recipient's `notif_prefs`
  in parallel with the subscriptions query and filters out recipients
  whose per-type toggle is false OR who are currently in their quiet
  window. Quiet hours uses `Intl.DateTimeFormat` with the stored
  timezone so travel doesn't break it.
- **Defensive fallback**: if the `notif_prefs` column doesn't exist
  yet (migration 013 not applied), the users query returns an error
  object. The function falls back to empty prefs so existing users
  still get notified. Do not remove that fallback — it's what kept
  things working when I merged migration 013 before the user applied
  it.

### 15. 1RM Challenges — multi-person contest (migrations 014–018)

Friendly 4-6 week 1 Rep Max contest between up to 4 people (creator
plus up to 3 invitees). One lift picked by the creator, everyone
trains that same lift. Scoring is percent improvement on an Epley
e1RM: `weight * (1 + reps/30)`. Highest percent gain wins.

**Tables:**
- `public.challenges` — creator in `challenger_id`. For new multi-
  person rows `challenged_id` is NULL (drop_not_null in migration
  016). `duration_weeks` + `auto_start_at` added in migration 016.
  `challenge_type = 'one_rep_max'` (migration 014 added it to the
  CHECK). `status` values: `pending`, `active`, `completed`,
  `declined`, `cancelled` (migration 014 added `cancelled`).
- `public.challenge_participants` — one row per person in a
  challenge. `status` text column (migration 016) with CHECK on
  `'invited' | 'joined' | 'declined' | 'left'`. Default `'joined'`
  so legacy rows from the 014/015 era still read correctly.
  `exercise_name` and `baseline_*` became NULLABLE in migration 016
  because 'invited' rows are inserted before the invitee has picked
  a lift or logged numbers. `last_reminded_at` throttles cron
  reminder pushes. Migration 015 dropped the CHECK on `exercise_name`
  so users can pick any lift (not just the original big 4).

**Option B — everyone trains the same lift (do not regress to
"each picks their own"):** The creator picks the lift during
create. Invitees inherit it — the accept flow skips the exercise
step entirely and pre-sets `draft.exerciseName` from the creator's
participant row. When the invitee accepts, their row is UPDATED
(not inserted) with the creator's `exercise_name` copied in.
Detail sheet shows the lift ONCE at the top of the header, not
per-row on the leaderboard. Home card shows the single lift. An
earlier version had each participant pick their own lift with
percent scoring equalizing the mismatch — the user rejected it as
"why is the other person being prompted to pick a lift?" and we
rewrote. Don't undo.

**48-hour grace + manual start:** On create, `auto_start_at` is
set to `now() + 48 hours`. The creator sees a START CHALLENGE
button in the detail sheet as soon as at least one invitee has
accepted. If they haven't started by 48h, `challenge-tick` cron
auto-starts (or auto-cancels if nobody accepted). If only 1 of N
invitees has accepted and the creator hits START, they get a
confirm prompt ("Only 1 of N has accepted. Start anyway?").

**Infinite recursion in RLS (migrations 017/018):** Migration 016's
`participants_select` had a self-reference subquery, and 017's
broadened `challenges_participant_select` had a cross-table
subquery against `challenge_participants`. Between them they form
an RLS cycle that Postgres's recursion detector rejects at plan
time, even though runtime short-circuits would save it. **Do not
write RLS subqueries that touch the same table or form a cycle
with another table's policy.** Migration 018 fixed it by hoisting
the membership check into a SECURITY DEFINER function:
```sql
create function public.ts_user_is_challenge_participant(cid uuid)
returns boolean language sql security definer stable ...
```
SD runs as the owner, bypasses RLS, breaks the cycle. Both
`participants_select` and `challenges_participant_select/update`
call it. If you add new RLS on these tables, use the helper
function pattern — don't put an inline exists-subquery against
challenge_participants back in.

**Challenge deep link via `sid: "c:<uuid>"` prefix:** The Android
TWA's native FCM service only appends `to_user_id` as
`?open_friend=` and `sid` as `?signal_id=` to the deep-link URL.
To carry the challenge id through tap-to-open without a native
code change, `_sendDirectPush` accepts an optional `challengeId`
5th argument and passes it to the edge function as `sid: "c:" +
challengeId`. Client-side, `_maybeHandlePendingNotifOpen` detects
the `"c:"` prefix on `pending.signalId`, strips it, and routes to
`_openChallengeDetailSheet` BEFORE the reaction-loop-close check
(which would otherwise catch challenge taps because the recipient
matches themselves and there's no workout signal_id). Don't
remove the prefix, don't reorder the branches in
`_maybeHandlePendingNotifOpen`.

**`_openChallengeDetailSheet` creates its shell synchronously**
(same technique `_openFriendActivity` uses) so cold-start deep
links from a push don't flash the home screen before the sheet
renders. The shell shows a LOADING placeholder, then the body
fills in after the data fetch resolves. On stale-push fallback
(cancelled / declined challenges filtered out by `_loadChallenges`),
it does a direct unfiltered by-id fetch so the user still sees
the result instead of "Challenge not found".

**History delete lock:** `confirmDeleteSession` and
`deleteHistoryEntry` (in `index.html`) both early-return with a
"History is locked during an active challenge." toast if
`_hasActiveChallenge()` returns true. Only DELETE is locked — note
and song edits still work. The lock unlocks the moment the
challenge flips to `completed` / `cancelled` / `declined`. Don't
extend the lock to other edit paths without explicit user ask.

**`challenge-tick` edge function (supabase/functions/challenge-tick/
index.ts):** Runs on a Supabase cron schedule (set up in the
dashboard; currently daily at midnight UTC). Three idempotent
phases:
- **Reminders**: any `status='invited'` row on a pending challenge
  whose `last_reminded_at` is >=23h ago (or null) gets a nudge
  push. Row is stamped regardless of push success so we don't
  retry within the day.
- **Auto-start / auto-cancel**: pending challenges past their
  `auto_start_at` flip to `active` if >=2 joined participants
  exist, else flip to `cancelled` with a "nobody accepted" push
  to the creator.
- **End detection**: active challenges past their `end_date` are
  scored. `status='left'` participants score 0 (forfeit).
  `status='invited'/'declined'` are excluded. Highest percent
  improvement wins; tie leaves `winner_id` null. Result pushes
  fire to every non-invited participant. All firePush calls pass
  the challenge id so result pushes also deep-link.
Function uses Service Role auth and bypasses RLS. Deploy through
the dashboard (there's no CI); verify JWT should be OFF.

**`_chErrMsg(e)` helper**: extracts Supabase error details
(`message` / `details` / `hint` / `code`) into a toast-friendly
string, truncated to 140 chars. Every challenge mutation catch
block uses it to surface the specific error — silent failures on
mobile (no devtools) can't be diagnosed without it. The original
"RLS infinite recursion" bug was invisible until this helper
started showing the actual error text in a toast.

**Home screen challenge card**: `_renderActiveChallengeHomeCard()`
inserts a styled banner above `#deload-banner` using the same
dynamic pattern as the pause and travel banners. 2px brand-red
border + subtle red-tinted diagonal gradient background — same
prominence tier as the travel banner, differentiated by color.
Pulls the lift from the creator's participant row (not the
current user's, because late-joining invitees may still have a
null exercise_name). Shows a days-left pill that flips color
(cream → gold under 7 days → brand red on final day). Leader
line dynamically colored green/red/cream based on position.

**Module-level state:**
- `_challenges` — cache of challenges the user is in, with embedded
  `participants` array. Populated by `_loadChallenges()`.
- `_challengeDraft` — in-flight create/accept flow state. Cleared
  on sheet close.
- `_CHALLENGE_MAX_INVITEES = 3` — enforced in the friend picker
  toggle.
- `_CHALLENGE_EXERCISE_ALIASES` — normalized lift name → program
  exId map for the baseline auto-fill resolver. Includes chip
  labels like "bench press" → `bench`, "overhead press" → `ohp`,
  etc. The 4753e41 commit added this because the chip labels
  didn't match DEFAULT_PROGRAM's full exercise names and no baseline
  ever auto-filled.

---

## How notifications flow end-to-end

1. **Friend does a workout** → page calls `send-push` Supabase edge function.
2. **`supabase/functions/send-push/index.ts`** looks up recipient's row
   in `onesignal_subscriptions`. For each recipient:
   - If `fcm_token` present → sends via FCM HTTP v1 API with a
     **data-only** payload (`android.priority = high`, `data` contains
     `title`, `body`, `avatar_url`, `signal_id`, `to_user_id`).
   - Else → falls back to VAPID web push using stored endpoint / keys.
3. **Native FCM delivery**: `TSFirebaseMessagingService.kt` receives the
   data-only message, builds a `NotificationCompat.Builder` with
   `R.drawable.ic_ts_notification` as small icon, sender avatar as
   large icon, and shows it. Fully native-looking.
4. **Web push fallback**: `sw.js` `push` event handler shows the
   notification with `icon` = sender avatar or `icon-192.png` fallback
   and `badge` = `/badge-dumbbell.png` (important — without this Chrome
   shows a generic Chrome icon for the status bar glyph).

Data-only FCM is intentional — if the FCM payload includes a `notification`
block, Android auto-displays it in the background and never calls
`onMessageReceived`, meaning our custom icon/title/body logic never runs.
Do not change to mixed payloads.

**Tap behavior:** the PendingIntent (Android FCM) and the `openWindow`
URL (sw.js web push) both carry `?open_friend=` and `?signal_id=`
query params built from the notification's data. The page reads these
on launch and deep-links into the friend reactions sheet for that
exact workout signal. Reaction notifications carry `to_user_id` but
no `signal_id` — those tap to the social modal instead, see Critical
section 6.

**Mutes (Critical section 9):** the workout fan-out path filters the
sender's `workout_notif_mutes` rows out of the targets list before
sending. Reaction notifications (`to_uid` path) are NOT filtered —
they're personal recipient-targeted, not workout fan-out. Friend
requests (Critical section 13) also use the `to_uid` path and bypass
mutes.

**Reaction push gate (Critical section 10):** every `_sendReaction`
call fires at most one push per unique `(signal_id, reaction_type)`
pair per session — the `_signalReactionState[signalId].pushed` Set
gates it. Re-tapping the same reaction type is a no-op (no DB, no
push, no network). Friends do not get spammed by rapid toggling.

---

## Reactions

The `reactions` table has a CHECK constraint on `reaction_type`:

```sql
check (reaction_type in (
  'thumbs_up', 'fist_bump', 'fire', 'checkmark',
  'goat', 'heart', 'salute', 'sparkles'
))
```

Plus `CHECK (from_user_id <> to_user_id)` (migration 010) — defensive
backstop preventing self-reactions. Plus a unique constraint on
`(from_user_id, signal_id)` so a user can only have one reaction per
signal at a time — upserts are keyed on those two columns.

Eight values total, currently rendered as 4-button rows in the
friend-activity sheet (`_openFriendActivity` in `index.html`). The
`RXNS` array near the top of that function defines the row layout —
slice 0..4 is row 1, slice 4..8 is row 2.

If you add new reaction types, you must:

1. Add them to the `RXNS` array in `_openFriendActivity`.
2. Add them to the `_rxnEmoji` map in `_sendReaction` so the push
   notification body text shows the right emoji.
3. Write a new migration (next number after the latest in
   `supabase/migrations/`, currently `012`) that drops and re-adds
   the CHECK constraint with the additional values. **Apply the
   migration to Supabase BEFORE merging the code**, otherwise users
   tapping the new buttons get the "Could not send reaction" toast
   because the upsert fails.

RLS on the reactions table has three policies:
- `reactions_own_all` — the sender has full access to their own
  reaction rows (read/insert/update/delete).
- `reactions_to_me_read` — the recipient can read reactions directed
  at them (powers the Today's Reactions section).
- `reactions_to_me_delete` (migration 012) — the recipient can
  delete reactions directed at them (powers the per-chip ✕ and the
  card-header trash bulk-clear).

Each user can have one reaction per signal at a time, and each unique
reaction type fires at most one push notification per signal per
session (see Critical section 10 for the per-type gate mechanics).

---

## Supabase migrations list

Apply migrations to Supabase via the SQL Editor BEFORE merging code
that depends on them. Always show the SQL to the user explicitly —
do not assume a past migration was applied just because you wrote
the file. (Happened this session: `reactions_to_me_delete` was
silently never applied and deletes appeared broken for hours.)

- `001_social_schema.sql` — initial tables
- `002_workout_notifications.sql` — added `thumbs_up` + unique
  constraints
- `003_reset_friendships.sql`
- `004_users_search_policy.sql`
- `005_fcm_token.sql`
- `006_fcm_nullable_player_id.sql`
- `007_unique_user_platform.sql`
- `008_expand_reaction_types.sql` — goat/heart/salute/sparkles
- `009_workout_notif_mutes.sql` — per-friend mute table + RLS
- `010_reactions_no_self.sql` — CHECK constraint preventing
  `from_user_id = to_user_id` (had a real collision when first
  applied — had to `DELETE FROM reactions WHERE from_user_id =
  to_user_id` first; keep that DELETE in mind if reopening this
  constraint on other tables)
- `011_mute_hides_workouts.sql` — `signals_friends_read` RLS policy
  updated to also exclude muted friends via NOT EXISTS subquery
- `012_reactions_delete_to_me.sql` — `reactions_to_me_delete` RLS
  policy so recipients can clear reactions directed at them
- `013_notif_prefs.sql` — `users.notif_prefs` JSONB column for
  per-type notification toggles + quiet hours
- `014_one_rep_max_challenges.sql` — initial 1RM challenge schema:
  adds `'one_rep_max'` to `challenge_type` CHECK, `'cancelled'`
  to `status` CHECK, `duration_weeks` column, and creates the
  `challenge_participants` table with RLS
- `015_challenge_any_exercise.sql` — drops the original CHECK on
  `challenge_participants.exercise_name` so users can pick any
  lift (not just the big 4)
- `016_challenge_multi_person.sql` — multi-person rework: drops
  NOT NULL on `challenges.challenged_id`, adds `auto_start_at`,
  adds `challenge_participants.status` + `last_reminded_at`,
  drops NOT NULL on baseline fields, rewrites
  `participants_select` / `participants_insert` RLS for the new
  model. **This migration introduced the RLS recursion bug —
  migration 018 is what fixes it.**
- `017_challenge_rls_participant_read.sql` — broadens
  `challenges_participant_select` / `_update` so invitees can read
  the parent challenge row via their participant row. Still had
  the recursion cycle from 016 — fixed by 018.
- `018_challenge_rls_fix_recursion.sql` — creates
  `ts_user_is_challenge_participant(uuid)` SECURITY DEFINER
  helper and rewrites both table's policies to call it instead
  of doing inline exists subqueries. Breaks the RLS cycle. See
  Critical section 15 for details.

---

## Android signing / build

- Keystore: committed as `signing.keystore` in repo root (yes, really —
  this is a single-developer project).
- Workflow: `.github/workflows/build-android.yml` — triggered manually
  via `workflow_dispatch`. Downloads Gradle 8.6, builds release AAB,
  uploads as artifact. The user then downloads the artifact and uploads
  to Google Play Console manually.
- `assetlinks.json`: lives at `.well-known/assetlinks.json` and is
  served by Netlify from `https://app.therapyandsneakers.org/.well-known/assetlinks.json`.
  Contains BOTH the App signing key AND the Upload key fingerprints —
  do not remove either, both are required for TWA verification to work
  across the Play App Signing flow.
- Notification icon sizes: correct density-specific variants are already
  in `drawable-mdpi` through `drawable-xxxhdpi`. Do not put back a single
  oversized PNG in plain `drawable/`.
- `themes.xml` defines `AppTheme.Launcher` with a dark `windowBackground`
  so the cold-start window frame is dark, not white. Applied to MainActivity
  in the manifest. Do not remove — it fixes the splash flash.

## Current version

- `versionCode 42`, `versionName '1.0.5'` in `android/app/build.gradle`.
- `sw.js` cache is `ts-muscle-v225` — bump this on any sw.js change so
  existing users get the new SW on their next visit.
- Always bump both `versionCode` and `versionName` for any native change
  that ships to Play Console.
- Play Console has hit "shadowed by higher versionCode" warnings before
  when multiple AABs were attached to the same release. If that
  happens, the fix is to remove the older AAB from the release, NOT to
  bump the versionCode — everything from the older build is already
  contained in the newer one (commits are cumulative).

## Branch workflow

- Working branch: `claude/fix-repo-connection-WsbVp`. Push here; user
  merges to main manually via PR. Do not push directly to main.
- After a merge lands on main, Netlify auto-deploys any web changes
  within ~1 minute. Native changes require the user to kick off the
  `Build Android` workflow, download the AAB, and upload to Play Console.

---

## Deferred / open items

These have been identified but intentionally left alone:

- **FCM token on re-sign-in edge case** — if a user signs out and signs
  back in as a different account on the same device without reloading,
  the newly-signed-in row may briefly miss `fcm_token` until the next
  launch refresh. Low priority, self-heals.
- **The Galaxy Note 20 white-square small icon** — described above,
  confirmed unfixable from app side.

---

## Things the user has explicitly asked me NOT to do

- Don't pretend to merge PRs I haven't actually merged.
- Don't claim I'm merging PRs — push and let the user merge.
- Don't remove the FCM fix from MainActivity.kt.
- Don't make changes that require more than one native build per feature.
- Don't add features, comments, or refactors beyond what was asked.
- Don't drag notification work into more native builds unless the web
  side truly cannot reach what is needed.
- Don't re-open the Note 20 white-square issue.
- Don't switch `notifSheetShown` back to `sessionStorage` — it MUST be
  `localStorage` so the dismissal persists across app restarts.
- Don't make `_maybeHandlePendingNotifOpen` async or add awaits to it.
  It must call `_openFriendActivity` synchronously so the friend sheet
  paints in the same frame as the home screen.
- Don't write the literal characters `</scr` + `ipt>` inside any JS
  comment, string, or template literal — see Critical section 7.
- Don't early-return from `_sendWorkoutSignal` on signal reuse. The
  signal dedup and the friend notification are SEPARATE concerns —
  reuse the signal row, but always fire the notification. Conflating
  them caused "notifications broke" behavior when a user started a
  workout within 2 hours of a previous start.
- Don't expand `_openFriendActivity`'s normal-path (`signalsQuery`
  without `signalId`) beyond `.limit(1)`. The friend activity sheet
  shows ONLY the most recent workout by design. The user explicitly
  rejected a 10-workout history view as overwhelming.
- Don't pass `signal_id` to `_openFriendActivity` from the Today's
  Reactions chip onclicks. The chip's signal is the CURRENT USER's
  own workout, and forwarding that to the reactor's sheet cross-wires
  a self-reaction path (loop never closes). Pass only the reactor's
  user ID.
- Don't add grouping, pagination, or a history feed to
  `_loadRecentReactions`. It's intentionally single-card, today-only.
  An earlier grouped version was rejected as overwhelming.
- Don't write apostrophes inside single-quoted JavaScript string
  literals. `'They'll know'` breaks the script silently (`'They'`
  closes the string, `ll know'` is invalid syntax). Use double
  quotes, backtick template literals, or escape the apostrophe.
  Broke the build at least twice this session.
- Don't tell the user a migration "is already applied" unless they
  have explicitly confirmed running it. ALWAYS show them the SQL in
  a user-facing reply (not just in a commit message — they don't
  read commit messages). Migration 012 was silently not applied for
  several commits because I told the user it was "already applied"
  based on a commit message they never saw. The delete feature was
  broken until we caught this.
- **Don't tell the user to "get the code from the repo" for
  migrations or edge function deploys — they have repeatedly said
  to paste the full contents in chat.** They deploy the edge
  function by copy-paste into the Supabase dashboard. If you write
  a migration or update an edge function, paste the whole thing in
  your reply even if it's long.
- Don't put each participant back on their own chosen lift for 1RM
  challenges. See Critical section 15 — Option B means the creator
  picks one lift and every invitee inherits it. The detail sheet
  header shows the lift once, leaderboard rows don't repeat it,
  and the accept flow skips the exercise step entirely.
- Don't write RLS subqueries that reference the same table (self-
  recursion) or form a cycle between two tables' policies. Postgres
  rejects the query at plan time with "infinite recursion detected
  in policy for relation ...". Use a SECURITY DEFINER helper
  function (pattern: `ts_user_is_challenge_participant`) to hoist
  the membership check out of the RLS body. See Critical section 15
  and migration 018.
- Don't remove the `"c:"` prefix on `sid` for challenge pushes, and
  don't reorder the branches in `_maybeHandlePendingNotifOpen` so
  the challenge-prefix check runs AFTER the "user matches self"
  fallback. Challenge notifications have `to_user_id = recipient`
  (their own id) which would otherwise hit the openSocialModal
  branch and dump the user on the friends drawer instead of the
  detail sheet.
- Don't make `_findRecentBaselineByExId` `return null` on the first
  out-of-window history entry. State.history is USUALLY sorted, but
  an unsorted array (e.g. after a backup restore) would cause the
  function to miss valid matches. Use `continue` so it keeps
  scanning the whole history.
- Don't early-return from `_openLogResultFlow` without checking that
  `me.status === 'joined'` AND `me.baseline_e1rm` is set. Invited
  rows (pending accept) have null baselines and would render
  "null × null (e1RM null)" in the log sheet.
- Don't remove the defensive `notif_prefs` fallback in
  `send-push/index.ts`. If the query errors because the column
  doesn't exist (migration 013 not applied), the function must
  fall back to empty prefs so existing users still get pushes.

---

## Fast reference: files touched most during this work

- `android/app/src/main/kotlin/io/github/jaysolo828_jpg/twa/MainActivity.kt`
- `android/app/src/main/kotlin/io/github/jaysolo828_jpg/twa/TSFirebaseMessagingService.kt`
- `android/app/src/main/kotlin/io/github/jaysolo828_jpg/twa/EnableNotificationsActivity.kt`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/build.gradle`
- `android/app/src/main/res/values/themes.xml`
- `android/app/src/main/res/drawable-*dpi/ic_ts_notification.png`
- `index.html` (search for: `_requestNotificationPermission`,
  `_maybeShowNotifSheet`, `_showNotifSheet`, `_triggerNativePermissionPrompt`,
  `_registerOneSignalPlayerId`, `_savePushSubscription`, `_saveFcmToken`,
  `_waitForFcmTokenIfAndroid`, `toggleSocialFeatures`, `openSocialModal`,
  `_maybeHandlePendingNotifOpen`, `_openFriendActivity`, `_sendReaction`,
  `_sendWorkoutSignal`, `_completeWorkoutSignal`, `_notifyFriends`,
  `_promptNotifsForSocial`, `_onNotifSettingsTap`, `_toggleWorkoutMute`,
  `_loadRecentReactions`, `_confirmRemoveSingleReaction`,
  `_removeSingleReaction`, `_confirmClearReactions`,
  `_clearReactionsForSignal`, `_sendFriendRequest`,
  `_cancelFriendRequest`, `_loadOutgoingFriendRequests`,
  `_mutedFriends`, `_signalReactionState`, `_recentReactionsCache`,
  `_outgoingFriendRequests`, `_BELL_OFF_SVG`)
- `sw.js` (push event handler + notificationclick deep link)
- `supabase/functions/send-push/index.ts` (fan-out + mute filter +
  per-type prefs filter + quiet hours)
- `supabase/functions/challenge-tick/index.ts` (daily cron — 1RM
  challenge reminders / auto-start / end-detection)
- `supabase/migrations/` — current latest is
  `018_challenge_rls_fix_recursion.sql`; see the Supabase migrations
  list above for the full history. The next new migration goes in
  as `019_*.sql`.
- Challenge-specific search terms in `index.html`:
  `_openChallengeIntroSheet`, `_startNewChallenge`,
  `_openNewChallengeFlow`, `_renderChallengeFriendPicker`,
  `_onChallengeFriendContinue`, `_challengeExercisePickerHtml`,
  `_onChallengeExerciseContinue`, `_challengeDurationPickerHtml`,
  `_challengeBaselinePickerHtml`, `_onChallengeBaselineContinue`,
  `_challengeConfirmHtml`, `_submitNewChallenge`,
  `_openAcceptChallengeFlow`, `_submitAcceptChallenge`,
  `_openChallengeDetailSheet`, `_renderChallengeDetailBody`,
  `_confirmStartChallenge`, `_startChallengeNow`,
  `_confirmCancelChallenge`, `_cancelChallenge`,
  `_confirmQuitChallenge`, `_quitChallenge`,
  `_confirmDeclineChallenge`, `_declineChallenge`,
  `_openLogResultFlow`, `_submitChallengeLog`,
  `_renderActiveChallengeHomeCard`, `_renderChallengesSection`,
  `_renderChallengesListHtml`, `_challengeRowHtml`,
  `_loadChallenges`, `_hasActiveChallenge`, `_findRecentBaselineByExId`,
  `_resolveExerciseToExId`, `_CHALLENGE_EXERCISE_ALIASES`,
  `_epley1RM`, `_improvementPct`, `_myParticipantRow`,
  `_otherParticipantRows`, `_joinedParticipants`,
  `_invitedParticipants`, `_declinedParticipants`, `_leftParticipants`,
  `_originalInviteeCount`, `_isChallengeCreator`, `_sendDirectPush`,
  `_chErrMsg`, `_challenges`, `_challengeDraft`,
  `_CHALLENGE_MAX_INVITEES`.
- Notification pref search terms in `index.html`:
  `_getDefaultNotifPrefs`, `_loadNotifPrefs`, `_saveNotifPrefs`,
  `_updateNotifPrefsSettingsSub`, `_openNotifPrefsSheet`,
  `_toggleNotifPref`, `_setNotifQuietTime`, `state.notifPrefs`.
- `.well-known/assetlinks.json`
