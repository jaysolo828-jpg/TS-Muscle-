// Supabase Edge Function: send-push
// Sends push notifications to a user's friends.
// Android users with an FCM token get a native notification (app icon, no Chrome branding).
// Everyone else gets a VAPID web push.

// ── Base64url helpers ────────────────────────────────────────────────────────
const b64u = (buf: Uint8Array) =>
  btoa(String.fromCharCode(...buf)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
const fromb64u = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));

// ── VAPID JWT (for web push) ─────────────────────────────────────────────────
async function makeVapidJwt(
  endpoint: string, subject: string,
  pubB64u: string, privB64u: string
): Promise<string> {
  const origin  = new URL(endpoint).origin;
  const exp     = Math.floor(Date.now() / 1000) + 12 * 3600;
  const enc     = new TextEncoder();
  const hdr     = b64u(enc.encode(JSON.stringify({ typ:'JWT', alg:'ES256' })));
  const pay     = b64u(enc.encode(JSON.stringify({ aud: origin, exp, sub: subject })));
  const msg     = `${hdr}.${pay}`;
  const pubBytes = fromb64u(pubB64u);
  const jwk = {
    kty:'EC', crv:'P-256', d: privB64u,
    x: b64u(pubBytes.slice(1, 33)), y: b64u(pubBytes.slice(33, 65)),
  };
  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name:'ECDSA', namedCurve:'P-256' }, false, ['sign']
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name:'ECDSA', hash:'SHA-256' }, key, enc.encode(msg))
  );
  return `${msg}.${b64u(sig)}`;
}

// ── VAPID payload encryption ─────────────────────────────────────────────────
async function encryptPayload(
  plaintext: string, p256dhB64u: string, authB64u: string
): Promise<Uint8Array> {
  const recvPub    = fromb64u(p256dhB64u);
  const authSecret = fromb64u(authB64u);
  const senderPair = await crypto.subtle.generateKey(
    { name:'ECDH', namedCurve:'P-256' }, true, ['deriveBits']
  );
  const spki      = new Uint8Array(await crypto.subtle.exportKey('spki', senderPair.publicKey));
  const senderPub = spki.slice(-65);
  const recvKey = await crypto.subtle.importKey(
    'raw', recvPub, { name:'ECDH', namedCurve:'P-256' }, false, []
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name:'ECDH', public: recvKey }, senderPair.privateKey, 256
  );
  const sharedSecret = new Uint8Array(sharedBits);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  async function hkdf(ikm: Uint8Array, hkdfSalt: Uint8Array, info: Uint8Array, len: number) {
    const base = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
    return new Uint8Array(
      await crypto.subtle.deriveBits({ name:'HKDF', hash:'SHA-256', salt: hkdfSalt, info }, base, len * 8)
    );
  }
  const enc = new TextEncoder();
  const prkInfo = new Uint8Array([...enc.encode('WebPush: info\0'), ...recvPub, ...senderPub]);
  const ikm  = await hkdf(sharedSecret, authSecret, prkInfo, 32);
  const cek  = await hkdf(ikm, salt, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const iv   = await hkdf(ikm, salt, enc.encode('Content-Encoding: nonce\0'), 12);
  const cekKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const padded = new Uint8Array([...enc.encode(plaintext), 0x02]);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name:'AES-GCM', iv, tagLength:128 }, cekKey, padded));
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  return new Uint8Array([...salt, ...rs, 65, ...senderPub, ...cipher]);
}

// ── Google OAuth2 access token (for FCM v1 API) ──────────────────────────────
async function getGoogleAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const enc = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);

  const header  = b64u(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = b64u(enc.encode(JSON.stringify({
    iss:   clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  })));
  const sigInput = `${header}.${payload}`;

  // Import RSA private key
  const pemBody = privateKeyPem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const rsaKey = await crypto.subtle.importKey(
    'pkcs8', keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', rsaKey, enc.encode(sigInput))
  );
  const jwt = `${sigInput}.${b64u(sig)}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const json = await resp.json();
  if (!json.access_token) throw new Error(`OAuth failed: ${JSON.stringify(json)}`);
  return json.access_token;
}

// ── Send one FCM message ─────────────────────────────────────────────────────
async function sendFcm(
  fcmToken: string, title: string, body: string,
  data: Record<string, string>,
  accessToken: string, projectId: string
): Promise<boolean> {
  const r = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          android: { priority: 'high' },
          data: { ...data, title, body },
        },
      }),
    }
  );
  return r.status >= 200 && r.status < 300;
}

// ── CORS headers ─────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Notification preferences helpers ─────────────────────────────────────────
// Check if the current time falls within a recipient's quiet hours
// window in their own timezone. Both endpoints are "HH:mm" strings.
// If the window is 22:00 → 06:00 it crosses midnight.
function isInQuietHours(prefs: any): boolean {
  if (!prefs || !prefs.quiet_enabled) return false;
  if (!prefs.quiet_start || !prefs.quiet_end || !prefs.timezone) return false;
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: prefs.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const hourStr = parts.find(p => p.type === 'hour')?.value || '00';
    const minuteStr = parts.find(p => p.type === 'minute')?.value || '00';
    const nowMinutes = parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10);
    const [sH, sM] = String(prefs.quiet_start).split(':').map((n: string) => parseInt(n, 10));
    const [eH, eM] = String(prefs.quiet_end).split(':').map((n: string) => parseInt(n, 10));
    const startMinutes = sH * 60 + (sM || 0);
    const endMinutes   = eH * 60 + (eM || 0);
    if (startMinutes === endMinutes) return false; // empty window
    if (startMinutes < endMinutes) {
      return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    }
    // Window crosses midnight (e.g. 22:00 → 06:00)
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  } catch (_) {
    return false;
  }
}

// Return true if this recipient should receive a notification of this
// type right now, based on their notif_prefs. Opt-out model: missing
// keys default to "notify". Quiet hours override everything.
function shouldNotify(prefs: any, notifType: string): boolean {
  if (!prefs || typeof prefs !== 'object') return true;
  if (isInQuietHours(prefs)) return false;
  // Per-type toggle: if the key is explicitly false, suppress.
  if (prefs[notifType] === false) return false;
  return true;
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const vapidPub   = Deno.env.get('VAPID_PUBLIC_KEY')           ?? '';
  const vapidPriv  = Deno.env.get('VAPID_PRIVATE_KEY')          ?? '';
  const vapidSub   = Deno.env.get('VAPID_SUBJECT')              ?? 'mailto:admin@therapyandsneakers.org';
  const sbUrl      = Deno.env.get('SUPABASE_URL')               ?? '';
  const svcKey     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  ?? '';
  const fbEmail    = Deno.env.get('FIREBASE_CLIENT_EMAIL')      ?? '';
  const fbKey      = Deno.env.get('FIREBASE_PRIVATE_KEY')       ?? '';
  const fbProject  = Deno.env.get('FIREBASE_PROJECT_ID')        ?? '';

  if (!sbUrl || !svcKey) {
    return new Response('Not configured', { status: 503, headers: CORS });
  }

  let body: Record<string, string>;
  try { body = await req.json(); }
  catch (_) { return new Response('Invalid JSON', { status: 400, headers: CORS }); }

  const { uid, to_uid, title, body: msgBody, sid, avatar_url, type } = body;
  if (!uid && !to_uid) return new Response('Missing uid or to_uid', { status: 400, headers: CORS });
  // Notification type used for per-recipient preference filtering.
  // Defaults to 'workout_start' for backwards compatibility if the
  // sender doesn't pass a type.
  const notifType: string = (typeof type === 'string' && type) ? type : 'workout_start';

  const h = { apikey: svcKey, Authorization: `Bearer ${svcKey}`, 'Content-Type': 'application/json' };

  // Resolve target user IDs
  let targets: string[] = [];
  if (to_uid) {
    // Direct send (e.g. reaction notification) — never filter through mutes,
    // those are personal/recipient-targeted not workout fan-out.
    targets = [to_uid];
  } else {
    // Workout fan-out: expand sender's accepted friends, then exclude any
    // friends the sender has explicitly muted from workout notifications.
    const [r1, r2, mutesResp] = await Promise.all([
      fetch(`${sbUrl}/rest/v1/friendships?status=eq.accepted&requester_id=eq.${uid}&select=addressee_id`, { headers: h }),
      fetch(`${sbUrl}/rest/v1/friendships?status=eq.accepted&addressee_id=eq.${uid}&select=requester_id`, { headers: h }),
      fetch(`${sbUrl}/rest/v1/workout_notif_mutes?muter_id=eq.${uid}&select=muted_friend_id`, { headers: h }),
    ]);
    const [f1, f2, mutes]: [any[], any[], any[]] = await Promise.all([
      r1.json().catch(() => []),
      r2.json().catch(() => []),
      mutesResp.json().catch(() => []),
    ]);
    const mutedSet = new Set(mutes.map(m => m.muted_friend_id));
    targets = [...f1.map(r => r.addressee_id), ...f2.map(r => r.requester_id)]
      .filter(t => !mutedSet.has(t));
  }

  if (!targets.length) {
    return new Response(JSON.stringify({ sent:0, reason:'no targets' }), { headers: { ...CORS, 'content-type':'application/json' } });
  }

  // Fetch subscriptions + per-recipient notification preferences in parallel.
  // prefs drives the per-type filter and quiet-hours suppression below.
  const [subsResp, prefsResp] = await Promise.all([
    fetch(
      `${sbUrl}/rest/v1/onesignal_subscriptions?user_id=in.(${targets.join(',')})&select=user_id,push_endpoint,push_p256dh,push_auth,fcm_token`,
      { headers: h }
    ),
    fetch(
      `${sbUrl}/rest/v1/users?id=in.(${targets.join(',')})&select=id,notif_prefs`,
      { headers: h }
    ),
  ]);
  const rawSubs: any[] = await subsResp.json().catch(() => []);
  // Defensive: if the users query errored (e.g. notif_prefs column
  // doesn't exist because migration 013 hasn't been applied yet),
  // PostgREST returns an error object instead of an array. Fall back
  // to empty prefs so existing users still get notified.
  const prefsRawUnknown = await prefsResp.json().catch(() => []);
  const prefsRows: any[] = Array.isArray(prefsRawUnknown) ? prefsRawUnknown : [];
  const prefsByUser: Record<string, any> = {};
  prefsRows.forEach(p => { prefsByUser[p.id] = p.notif_prefs || {}; });

  // Filter subscriptions: drop any recipient whose notif_prefs say they
  // don't want this notification type right now (per-type toggle or
  // quiet hours). Opt-out model — missing prefs default to notify.
  const subs: any[] = rawSubs.filter(sub => {
    return shouldNotify(prefsByUser[sub.user_id], notifType);
  });

  if (!subs.length) {
    return new Response(JSON.stringify({ sent:0, reason:'no subscriptions after prefs filter' }), { headers: { ...CORS, 'content-type':'application/json' } });
  }

  const notifTitle  = title   || 'T&S Muscle';
  const notifBody   = msgBody || '';
  const extraData: Record<string, string> = {};
  if (sid)        extraData.signal_id  = sid;
  if (uid||to_uid) extraData.to_user_id = uid || to_uid || '';
  if (avatar_url) extraData.avatar_url  = avatar_url;

  let sent = 0, failed = 0;
  const debug: string[] = [];

  // Get FCM access token once (if any subs have FCM tokens)
  const hasFcm = subs.some(s => s.fcm_token);
  let fcmAccessToken = '';
  if (hasFcm && fbEmail && fbKey && fbProject) {
    try { fcmAccessToken = await getGoogleAccessToken(fbEmail, fbKey); } catch (e) { debug.push(`oauth_error:${e}`); }
  }

  // Group subscriptions by user_id. A single user can have multiple rows
  // (e.g. an Android row with an FCM token AND an older web-push row).
  // We want to send at most ONE notification per user: FCM if available
  // and working, web push otherwise. Without this grouping the loop below
  // would fire both the native notification (FCM row) AND the Chrome
  // notification (web-push row) for the same user simultaneously.
  const subsByUser: Record<string, any[]> = {};
  for (const sub of subs) {
    if (!subsByUser[sub.user_id]) subsByUser[sub.user_id] = [];
    subsByUser[sub.user_id].push(sub);
  }

  await Promise.all(Object.entries(subsByUser).map(async ([_userId, userSubs]) => {
    // Try FCM first across all this user's rows (Android native notification)
    const fcmSub = fcmAccessToken ? userSubs.find(s => s.fcm_token) : undefined;
    if (fcmSub) {
      const ok = await sendFcm(fcmSub.fcm_token, notifTitle, notifBody, extraData, fcmAccessToken, fbProject)
        .catch((e) => { debug.push(`fcm_error:${e}`); return false; });
      if (ok) { sent++; debug.push(`fcm_ok:${fcmSub.fcm_token.slice(0,15)}`); return; }
      debug.push(`fcm_failed:${fcmSub.fcm_token.slice(0,15)}`);
    } else {
      debug.push(`no_fcm:has_token=${!!userSubs.find(s=>s.fcm_token)},has_access=${!!fcmAccessToken}`);
    }

    // Fall back to VAPID web push — try each of this user's web-push rows
    // until one succeeds (iOS, desktop, Android without FCM token)
    for (const sub of userSubs) {
      if (!sub.push_endpoint || !sub.push_p256dh || !sub.push_auth || !vapidPub || !vapidPriv) continue;
      try {
        const payload  = JSON.stringify({ title: notifTitle, body: notifBody, icon: avatar_url || null, data: extraData });
        const encBody  = await encryptPayload(payload, sub.push_p256dh, sub.push_auth);
        const jwt      = await makeVapidJwt(sub.push_endpoint, vapidSub, vapidPub, vapidPriv);
        const r = await fetch(sub.push_endpoint, {
          method: 'POST',
          headers: {
            'Content-Type':     'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'TTL':              '86400',
            'Urgency':          'high',
            'Authorization':    `vapid t=${jwt},k=${vapidPub}`,
          },
          body: encBody,
        });
        if (r.status >= 200 && r.status < 300) { sent++; debug.push(`webpush_ok`); return; }
        debug.push(`webpush_failed:${r.status}`);
      } catch (_) {}
    }
    failed++;
  }));

  return new Response(JSON.stringify({ sent, failed, debug }), {
    headers: { ...CORS, 'content-type':'application/json' },
  });
});
