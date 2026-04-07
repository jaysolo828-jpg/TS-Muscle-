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

- **`sessionStorage.notifSheetShown` is only set on explicit user
  action** (NOT NOW, ENABLE, GOT IT). Do not set it at render time — a
  service-worker `controllerchange` reload will wipe the DOM and the
  post-reload attempt will bail out because the flag is set.
- **z-index is `999999`** — the app has dozens of modals at `99999`
  which would visually cover a lower sheet. Do not lower it.
- **The sheet shows in all three permission states** (`default`,
  `denied`, `granted`) — blocking on `granted` hides the sheet for
  users in the split-permission state.
- **`_requestNotificationPermission` does not early-return on `denied`
  or `granted`** — both still call `_maybeShowNotifSheet` so the user
  can see and recover.

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

### 5. The notification small icon on Samsung Note 20 (abandoned)

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

- `versionCode 40`, `versionName '1.0.3.1'` in `android/app/build.gradle`.
- Always bump both for any native change that ships to Play Console.
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
  `_waitForFcmTokenIfAndroid`, `toggleSocialFeatures`, `openSocialModal`)
- `sw.js` (push event handler)
- `supabase/functions/send-push/index.ts`
- `.well-known/assetlinks.json`
