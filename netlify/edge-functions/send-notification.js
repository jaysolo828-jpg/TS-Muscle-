// Sends web push notifications using VAPID (no OneSignal SDK dependency).
// Accepts an array of push subscriptions: [{ endpoint, keys: { p256dh, auth } }]
// VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT must be set in Netlify env vars.

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function base64UrlEncode(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeVapidJwt(audience, subject, publicKeyB64, privateKeyB64) {
  const now = Math.floor(Date.now() / 1000);
  const header  = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    aud: audience, exp: now + 43200, sub: subject,
  })));
  const sigInput = header + '.' + payload;

  // Derive x,y from the raw 65-byte public key so we can import via JWK
  const pubRaw = base64UrlDecode(publicKeyB64);
  const x = base64UrlEncode(pubRaw.slice(1, 33));
  const y = base64UrlEncode(pubRaw.slice(33, 65));

  const privKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: privateKeyB64, x, y, key_ops: ['sign'], ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privKey,
    new TextEncoder().encode(sigInput)
  );
  return sigInput + '.' + base64UrlEncode(sig);
}

async function encryptPayload(subscription, payload) {
  const encoder = new TextEncoder();
  const payloadBytes = typeof payload === 'string' ? encoder.encode(payload) : payload;

  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']
  );
  const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);

  const clientPublicKey = await crypto.subtle.importKey(
    'raw', base64UrlDecode(subscription.keys.p256dh),
    { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey }, serverKeyPair.privateKey, 256
  );

  const authSecret = base64UrlDecode(subscription.keys.auth);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive content encryption key and nonce (RFC 8291)
  const prk = await hkdfExtract(authSecret, new Uint8Array(sharedBits));
  const keyInfo  = buildInfo('Content-Encoding: aes128gcm\0', serverPublicKeyRaw, subscription.keys.p256dh, authSecret);
  const contentKey = await hkdfExpand(prk, keyInfo, 16);
  const nonceInfo = buildInfo('Content-Encoding: nonce\0', serverPublicKeyRaw, subscription.keys.p256dh, authSecret);
  const nonce = await hkdfExpand(prk, nonceInfo, 12);

  const key = await crypto.subtle.importKey('raw', contentKey, { name: 'AES-GCM' }, false, ['encrypt']);
  // Add padding delimiter byte (0x02) as per RFC 8291
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2;

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, paddedPayload);

  // Build RFC 8188 header
  const recordSize = 4096;
  const header = new Uint8Array(21 + serverPublicKeyRaw.byteLength);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, recordSize, false);
  header[20] = serverPublicKeyRaw.byteLength;
  header.set(new Uint8Array(serverPublicKeyRaw), 21);

  const body = new Uint8Array(header.byteLength + encrypted.byteLength);
  body.set(header, 0);
  body.set(new Uint8Array(encrypted), header.byteLength);
  return body;
}

async function hkdfExtract(salt, ikm) {
  const saltKey = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = await crypto.subtle.sign('HMAC', saltKey, ikm);
  return new Uint8Array(prk);
}

async function hkdfExpand(prk, info, length) {
  const prkKey = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const input = new Uint8Array(info.length + 1);
  input.set(info); input[info.length] = 1;
  const okm = await crypto.subtle.sign('HMAC', prkKey, input);
  return new Uint8Array(okm).slice(0, length);
}

function buildInfo(type, serverPublicKey, clientPublicKeyB64, authSecret) {
  const enc = new TextEncoder();
  const clientPub = base64UrlDecode(clientPublicKeyB64);
  const typeBytes = enc.encode(type);
  const info = new Uint8Array(typeBytes.length + 2 + serverPublicKey.byteLength + 2 + clientPub.length);
  let offset = 0;
  info.set(typeBytes, offset); offset += typeBytes.length;
  new DataView(info.buffer).setUint16(offset, serverPublicKey.byteLength, false); offset += 2;
  info.set(new Uint8Array(serverPublicKey), offset); offset += serverPublicKey.byteLength;
  new DataView(info.buffer).setUint16(offset, clientPub.length, false); offset += 2;
  info.set(clientPub, offset);
  return info;
}

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const vapidPublicKey  = Deno.env.get('VAPID_PUBLIC_KEY')  || '';
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
  const vapidSubject    = Deno.env.get('VAPID_SUBJECT')     || 'mailto:admin@therapyandsneakers.org';

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response('VAPID keys not configured', { status: 503 });
  }

  try {
    const { subscriptions, title, body, data: notifData } = await req.json();
    if (!subscriptions?.length) return new Response('Missing subscriptions', { status: 400 });

    const msgPayload = JSON.stringify({ title: title || 'T&S Muscle', body: body || '', data: notifData || {} });

    const results = await Promise.allSettled(subscriptions.map(async (sub) => {
      if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return;

      const url = new URL(sub.endpoint);
      const audience = url.origin;
      const jwt = await makeVapidJwt(audience, vapidSubject, vapidPublicKey, vapidPrivateKey);
      const encrypted = await encryptPayload(sub, msgPayload);

      const resp = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type':    'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'Authorization':   `vapid t=${jwt},k=${vapidPublicKey}`,
          'TTL':             '86400',
        },
        body: encrypted,
      });
      return resp.status;
    }));

    return new Response(JSON.stringify({ sent: results.length }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export const config = { path: '/send-notification' };
