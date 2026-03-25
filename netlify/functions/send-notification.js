// Web Push (RFC 8291) using ONLY Node 18 built-in crypto — zero npm dependencies.
// Node 18 exposes crypto.subtle (WebCrypto) globally, so no require() needed.

const enc = new TextEncoder();

function b64u(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromb64u(s) {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function concat(...arrays) {
  return Buffer.concat(arrays.map(a => Buffer.from(a)));
}

async function hkdf(salt, ikm, info, len) {
  const saltKey = await crypto.subtle.importKey('raw', salt,
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = Buffer.from(await crypto.subtle.sign('HMAC', saltKey, ikm));
  const prkKey = await crypto.subtle.importKey('raw', prk,
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const result = Buffer.alloc(len);
  let prev = Buffer.alloc(0);
  let off = 0;
  for (let i = 1; off < len; i++) {
    prev = Buffer.from(await crypto.subtle.sign('HMAC', prkKey,
      concat(prev, Buffer.from(info), Buffer.from([i]))));
    prev.copy(result, off, 0, Math.min(prev.length, len - off));
    off += prev.length;
  }
  return result;
}

async function encryptWebPush(endpoint, p256dhB64u, authB64u, payload) {
  const uaPublic = fromb64u(p256dhB64u);
  const uaAuth   = fromb64u(authB64u);

  const senderKey = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = Buffer.from(
    await crypto.subtle.exportKey('raw', senderKey.publicKey));

  const uaKey = await crypto.subtle.importKey(
    'raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);

  const ecdhSecret = Buffer.from(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey },
      senderKey.privateKey, 256));

  const info = concat(
    Buffer.from('WebPush: info\x00'), uaPublic, asPublic);
  const ikm = await hkdf(uaAuth, ecdhSecret, info, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek   = await hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\x00'), 16);
  const nonce = await hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\x00'), 12);

  const cekKey = await crypto.subtle.importKey(
    'raw', cek, { name: 'AES-GCM', length: 128 }, false, ['encrypt']);

  const plaintext = Buffer.from(payload);
  const padded = concat(plaintext, Buffer.from([2]));

  const ciphertext = Buffer.from(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, padded));

  const rsBytes = Buffer.alloc(4);
  rsBytes.writeUInt32BE(4096, 0);
  return concat(Buffer.from(salt), rsBytes, Buffer.from([65]), asPublic, ciphertext);
}

async function vapidAuth(endpoint, privB64u, pubB64u, subject) {
  const pub = fromb64u(pubB64u);
  const jwk = {
    kty: 'EC', crv: 'P-256',
    d: privB64u,
    x: b64u(pub.slice(1, 33)),
    y: b64u(pub.slice(33, 65)),
  };
  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

  const audience = new URL(endpoint).origin;
  const hdr = b64u(Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'JWT' })));
  const pay = b64u(Buffer.from(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: subject,
  })));
  const toSign = `${hdr}.${pay}`;
  const sig = Buffer.from(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' },
      key, Buffer.from(toSign)));
  return `vapid t=${toSign}.${b64u(sig)},k=${pubB64u}`;
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const pubKey  = process.env.VAPID_PUBLIC_KEY  || '';
  const privKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@therapyandsneakers.org';

  if (!pubKey || !privKey) {
    return { statusCode: 503, body: 'VAPID keys not configured' };
  }

  let parsed;
  try { parsed = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { subscriptions, title, body, data: notifData } = parsed;
  if (!subscriptions?.length) return { statusCode: 400, body: 'Missing subscriptions' };

  const payload = JSON.stringify({
    title: title || 'T&S Muscle',
    body:  body  || '',
    data:  notifData || {},
  });

  const results = await Promise.allSettled(subscriptions.map(async sub => {
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return;
    const body = await encryptWebPush(
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
      body,
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

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sent: results.length, errors }),
  };
};
