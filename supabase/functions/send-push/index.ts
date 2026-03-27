// Supabase Edge Function: send-push
// Sends Web Push notifications to a user's friends (or a specific user).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// You must add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT as secrets.

const b64u = (buf: Uint8Array) =>
  btoa(String.fromCharCode(...buf)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
const fromb64u = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));

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
    kty:'EC', crv:'P-256',
    d: privB64u,
    x: b64u(pubBytes.slice(1, 33)),
    y: b64u(pubBytes.slice(33, 65)),
  };
  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name:'ECDSA', namedCurve:'P-256' }, false, ['sign']
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name:'ECDSA', hash:'SHA-256' }, key, enc.encode(msg))
  );
  return `${msg}.${b64u(sig)}`;
}

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

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const vapidPub  = Deno.env.get('VAPID_PUBLIC_KEY')          ?? '';
  const vapidPriv = Deno.env.get('VAPID_PRIVATE_KEY')         ?? '';
  const vapidSub  = Deno.env.get('VAPID_SUBJECT')             ?? 'mailto:admin@therapyandsneakers.org';
  const sbUrl     = Deno.env.get('SUPABASE_URL')              ?? '';
  const svcKey    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!vapidPub || !vapidPriv || !sbUrl || !svcKey) {
    return new Response('Not configured', { status: 503, headers: CORS });
  }

  let body: Record<string, string>;
  try { body = await req.json(); }
  catch (_) { return new Response('Invalid JSON', { status: 400, headers: CORS }); }

  const { uid, to_uid, title, body: msgBody, sid, avatar_url } = body;
  if (!uid && !to_uid) return new Response('Missing uid or to_uid', { status: 400, headers: CORS });

  const h = { apikey: svcKey, Authorization: `Bearer ${svcKey}`, 'Content-Type': 'application/json' };

  let targets: string[] = [];
  if (to_uid) {
    targets = [to_uid];
  } else {
    const [r1, r2] = await Promise.all([
      fetch(`${sbUrl}/rest/v1/friendships?status=eq.accepted&requester_id=eq.${uid}&select=addressee_id`, { headers: h }),
      fetch(`${sbUrl}/rest/v1/friendships?status=eq.accepted&addressee_id=eq.${uid}&select=requester_id`, { headers: h }),
    ]);
    const [f1, f2]: [any[], any[]] = await Promise.all([r1.json().catch(() => []), r2.json().catch(() => [])]);
    targets = [...f1.map(r => r.addressee_id), ...f2.map(r => r.requester_id)];
  }

  if (!targets.length) {
    return new Response(JSON.stringify({ sent:0, reason:'no targets' }), { headers: { ...CORS, 'content-type':'application/json' } });
  }

  const subsResp = await fetch(
    `${sbUrl}/rest/v1/onesignal_subscriptions?user_id=in.(${targets.join(',')})&push_endpoint=not.is.null&select=user_id,push_endpoint,push_p256dh,push_auth`,
    { headers: h }
  );
  const subs: any[] = await subsResp.json().catch(() => []);

  if (!subs.length) {
    return new Response(JSON.stringify({ sent:0, reason:'no subscriptions' }), { headers: { ...CORS, 'content-type':'application/json' } });
  }

  const payload = JSON.stringify({
    title: title || 'T&S Muscle',
    body:  msgBody || '',
    icon:  avatar_url || null,
    data:  sid ? { signal_id: sid, to_user_id: uid || to_uid } : {},
  });

  let sent = 0, failed = 0;
  await Promise.all(subs.map(async (sub: any) => {
    if (!sub.push_endpoint || !sub.push_p256dh || !sub.push_auth) return;
    try {
      const encBody = await encryptPayload(payload, sub.push_p256dh, sub.push_auth);
      const jwt     = await makeVapidJwt(sub.push_endpoint, vapidSub, vapidPub, vapidPriv);
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
      if (r.status >= 200 && r.status < 300) sent++; else failed++;
    } catch (_) { failed++; }
  }));

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { ...CORS, 'content-type':'application/json' }
  });
});
