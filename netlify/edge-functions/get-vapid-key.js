// Serves VAPID public key AND handles push notification sending (via ?d= param).
// Using this existing confirmed-working path since new edge function paths return 404.

const enc = new TextEncoder();

function b64u(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromb64u(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (b64.length % 4)) % 4;
  return Uint8Array.from(atob(b64 + '='.repeat(pad)), c => c.charCodeAt(0));
}

function concat(...arrays) {
  const len = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

async function hkdf(salt, ikm, info, len) {
  const saltKey = await crypto.subtle.importKey('raw', salt,
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', saltKey, ikm));
  const prkKey = await crypto.subtle.importKey('raw', prk,
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const result = new Uint8Array(len);
  let prev = new Uint8Array(0);
  let off = 0;
  for (let i = 1; off < len; i++) {
    prev = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey,
      concat(prev, info, new Uint8Array([i]))));
    result.set(prev.subarray(0, Math.min(prev.length, len - off)), off);
    off += prev.length;
  }
  return result;
}

async function encryptWebPush(endpoint, p256dhB64u, authB64u, payload) {
  const uaPublic = fromb64u(p256dhB64u);
  const uaAuth   = fromb64u(authB64u);
  const senderKey = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(
    await crypto.subtle.exportKey('raw', senderKey.publicKey));
  const uaKey = await crypto.subtle.importKey(
    'raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey },
      senderKey.privateKey, 256));
  const info = concat(enc.encode('WebPush: info\x00'), uaPublic, asPublic);
  const ikm = await hkdf(uaAuth, ecdhSecret, info, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek   = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\x00'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\x00'), 12);
  const cekKey = await crypto.subtle.importKey(
    'raw', cek, { name: 'AES-GCM', length: 128 }, false, ['encrypt']);
  const padded = concat(enc.encode(payload), new Uint8Array([2]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, padded));
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, 4096, false);
  return concat(salt, rsBytes, new Uint8Array([65]), asPublic, ciphertext);
}

async function vapidAuth(endpoint, privB64u, pubB64u, subject) {
  const pub = fromb64u(pubB64u);
  const key = await crypto.subtle.importKey('jwk', {
    kty: 'EC', crv: 'P-256', d: privB64u,
    x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)),
  }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const audience = new URL(endpoint).origin;
  const hdr = b64u(enc.encode(JSON.stringify({ alg: 'ES256', typ: 'JWT' })));
  const pay = b64u(enc.encode(JSON.stringify({
    aud: audience, exp: Math.floor(Date.now() / 1000) + 43200, sub: subject,
  })));
  const toSign = `${hdr}.${pay}`;
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' },
      key, enc.encode(toSign)));
  return `vapid t=${toSign}.${b64u(sig)},k=${pubB64u}`;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const d   = url.searchParams.get('d');

  const pubKey  = Deno.env.get('VAPID_PUBLIC_KEY')  || '';
  const privKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
  const subject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@therapyandsneakers.org';

  // No ?d= param — serve VAPID public key as before
  if (!d) {
    if (!pubKey) {
      return new Response(JSON.stringify({ vapid_public_key: null, error: 'VAPID_PUBLIC_KEY not set' }), {
        status: 503, headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ vapid_public_key: pubKey }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  }

  // Has ?d= param — send push notification
  if (!pubKey || !privKey) {
    return new Response('VAPID keys not configured', { status: 503 });
  }

  let parsed;
  try {
    parsed = JSON.parse(new TextDecoder().decode(fromb64u(d)));
  } catch(e) { return new Response('Invalid payload', { status: 400 }); }

  const { subscriptions, title, body, data: notifData } = parsed;
  if (!subscriptions?.length) return new Response('Missing subscriptions', { status: 400 });

  const payload = JSON.stringify({
    title: title || 'T&S Muscle', body: body || '', data: notifData || {},
  });

  const results = await Promise.allSettled(subscriptions.map(async sub => {
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return;
    const encrypted = await encryptWebPush(
      sub.endpoint, sub.keys.p256dh, sub.keys.auth, payload);
    const auth = await vapidAuth(sub.endpoint, privKey, pubKey, subject);
    const resp = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      body: encrypted,
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`FCM ${resp.status}: ${txt.slice(0, 200)}`);
    }
    return resp.status;
  }));

  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason?.message || String(r.reason));

  return new Response(JSON.stringify({ sent: results.length, errors }), {
    status: 200, headers: { 'content-type': 'application/json' },
  });
}

export const config = { path: '/get-vapid-key' };
