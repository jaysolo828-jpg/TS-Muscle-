/**
 * push.js — Netlify Node.js Function (no npm deps, uses only built-in Node.js crypto + https)
 * POST /.netlify/functions/push
 *   { uid, title, body, sid }          → notify all accepted friends
 *   { to_uid, title, body }            → notify a specific user (reactions)
 * GET  /.netlify/functions/push        → health check { alive: true }
 */

const crypto = require('crypto');
const https  = require('https');

// ─── VAPID JWT ────────────────────────────────────────────────────────────────

function b64u(buf) { return buf.toString('base64url'); }
function fromb64u(s) { return Buffer.from(s, 'base64url'); }

/**
 * Build a signed VAPID JWT for the given push endpoint origin.
 * vapidPublicKey / vapidPrivateKey are base64url raw EC bytes.
 */
function makeVapidJwt(endpoint, subject, vapidPublicKey, vapidPrivateKey) {
  const origin  = new URL(endpoint).origin;
  const exp     = Math.floor(Date.now() / 1000) + 12 * 3600;

  const hdr = b64u(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const pay = b64u(Buffer.from(JSON.stringify({ aud: origin, exp, sub: subject })));
  const msg = `${hdr}.${pay}`;

  // Reconstruct a JWK from the raw base64url key bytes so Node can use it
  const pubBytes = fromb64u(vapidPublicKey); // 65-byte uncompressed point (04 || x || y)
  const x = b64u(pubBytes.slice(1, 33));
  const y = b64u(pubBytes.slice(33, 65));
  const jwk = { kty: 'EC', crv: 'P-256', d: vapidPrivateKey, x, y };
  const privKey = crypto.createPrivateKey({ key: jwk, format: 'jwk' });

  // Sign with ECDSA P-256 SHA-256, output raw r||s (IEEE P1363)
  const sig = crypto.sign('SHA256', Buffer.from(msg), { key: privKey, dsaEncoding: 'ieee-p1363' });
  return `${msg}.${b64u(sig)}`;
}

// ─── Web Push Encryption (RFC 8291 / RFC 8188 aes128gcm) ─────────────────────

async function encryptPayload(plaintext, subscriberPublicKeyB64u, authB64u) {
  const receiverPublicKey = fromb64u(subscriberPublicKeyB64u); // 65-byte uncompressed
  const auth = fromb64u(authB64u); // 16-byte auth secret

  // Generate ephemeral sender key pair
  const senderKey = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const senderPublicKey = senderKey.publicKey
    .export({ type: 'spki', format: 'der' })
    .slice(-65); // last 65 bytes are the uncompressed public key

  // ECDH shared secret
  const receiverKey = crypto.createPublicKey({
    key: Buffer.concat([
      Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200', 'hex'),
      receiverPublicKey,
    ]),
    format: 'der',
    type: 'spki',
  });
  const sharedSecret = crypto.diffieHellman({ privateKey: senderKey.privateKey, publicKey: receiverKey });

  // salt (16 random bytes)
  const salt = crypto.randomBytes(16);

  // HKDF-SHA256 helper
  function hkdf(ikm, salt, info, len) {
    const prk = crypto.createHmac('sha256', salt).update(ikm).digest();
    const t   = Buffer.alloc(0);
    let   okm = Buffer.alloc(0);
    let   prev = t;
    for (let i = 1; okm.length < len; i++) {
      prev = crypto.createHmac('sha256', prk)
        .update(Buffer.concat([prev, info, Buffer.from([i])]))
        .digest();
      okm = Buffer.concat([okm, prev]);
    }
    return okm.slice(0, len);
  }

  // ikm from shared secret + auth (RFC 8291 §3.3)
  const prkInfoBuf = Buffer.concat([
    Buffer.from('WebPush: info\0'),
    receiverPublicKey,
    senderPublicKey,
  ]);
  const ikm = hkdf(sharedSecret, auth, prkInfoBuf, 32);

  // Content Encryption Key (16 bytes) and Nonce (12 bytes)
  const cekInfo   = Buffer.from('Content-Encoding: aes128gcm\0');
  const nonceInfo = Buffer.from('Content-Encoding: nonce\0');
  const cek   = hkdf(ikm, salt, cekInfo, 16);
  const nonce = hkdf(ikm, salt, nonceInfo, 12);

  // Pad and encrypt (RFC 8188 §2): append 0x02 delimiter then encrypt
  const plainBuf = Buffer.from(plaintext, 'utf8');
  const padded   = Buffer.concat([plainBuf, Buffer.from([0x02])]);

  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
  const tag = cipher.getAuthTag();
  const ciphertext = Buffer.concat([encrypted, tag]);

  // RFC 8188 §2: header = salt (16) + rs (4) + idlen (1) + sender public key (65)
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096, 0); // record size
  const header = Buffer.concat([salt, rs, Buffer.from([65]), senderPublicKey]);

  return {
    body: Buffer.concat([header, ciphertext]),
    senderPublicKey,
  };
}

// ─── HTTP POST helper ─────────────────────────────────────────────────────────

function httpPost(targetUrl, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const req = https.request({
      hostname: u.hostname,
      port:     u.port || 443,
      path:     u.pathname + u.search,
      method:   'POST',
      headers,
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Send one Web Push ────────────────────────────────────────────────────────

async function sendOnePush(subscription, payloadStr, vapidPublicKey, vapidPrivateKey, vapidSubject) {
  const { endpoint, p256dh, auth } = subscription;
  if (!endpoint || !p256dh || !auth) throw new Error('Missing subscription fields');

  const { body } = await encryptPayload(payloadStr, p256dh, auth);

  const jwt = makeVapidJwt(endpoint, vapidSubject, vapidPublicKey, vapidPrivateKey);

  const result = await httpPost(endpoint, {
    'Content-Type':     'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    'Content-Length':   body.length,
    'TTL':              '86400',
    'Authorization':    `vapid t=${jwt},k=${vapidPublicKey}`,
  }, body);

  return result;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async function(event) {
  // Health check
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ alive: true }),
    };
  }

  const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY           || '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY          || '';
  const vapidSubject    = process.env.VAPID_SUBJECT              || 'mailto:admin@therapyandsneakers.org';
  const supabaseUrl     = process.env.SUPABASE_URL               || '';
  const serviceKey      = process.env.SUPABASE_SERVICE_ROLE_KEY  || '';

  if (!vapidPublicKey || !vapidPrivateKey || !supabaseUrl || !serviceKey) {
    return { statusCode: 503, body: 'Not configured' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (_) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { uid, to_uid, title, body: msgBody, sid } = body;
  if (!uid && !to_uid) {
    return { statusCode: 400, body: 'Missing uid or to_uid' };
  }

  const sbHeaders = {
    apikey:        serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  // Resolve target user IDs
  let targetUserIds = [];
  if (to_uid) {
    targetUserIds = [to_uid];
  } else {
    const [r1, r2] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/friendships?status=eq.accepted&requester_id=eq.${uid}&select=addressee_id`, { headers: sbHeaders }),
      fetch(`${supabaseUrl}/rest/v1/friendships?status=eq.accepted&addressee_id=eq.${uid}&select=requester_id`, { headers: sbHeaders }),
    ]);
    const [f1, f2] = await Promise.all([r1.json().catch(() => []), r2.json().catch(() => [])]);
    targetUserIds = [...f1.map(r => r.addressee_id), ...f2.map(r => r.requester_id)];
  }

  if (!targetUserIds.length) {
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sent: 0, reason: 'no targets' }) };
  }

  // Fetch subscriptions
  const subsResp = await fetch(
    `${supabaseUrl}/rest/v1/onesignal_subscriptions?user_id=in.(${targetUserIds.join(',')})&push_endpoint=not.is.null&select=user_id,push_endpoint,push_p256dh,push_auth`,
    { headers: sbHeaders }
  );
  const subs = await subsResp.json().catch(() => []);

  if (!Array.isArray(subs) || !subs.length) {
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sent: 0, reason: 'no subscriptions' }) };
  }

  const payload = JSON.stringify({
    title: title || 'T&S Muscle',
    body:  msgBody || '',
    data:  sid ? { signal_id: sid, to_user_id: uid || to_uid } : {},
  });

  let sent = 0, failed = 0, errors = [];
  await Promise.all(subs.map(async sub => {
    try {
      const r = await sendOnePush(
        { endpoint: sub.push_endpoint, p256dh: sub.push_p256dh, auth: sub.push_auth },
        payload,
        vapidPublicKey, vapidPrivateKey, vapidSubject
      );
      if (r.status >= 200 && r.status < 300) { sent++; }
      else { failed++; errors.push(r.status + ':' + r.body.slice(0, 60)); }
    } catch (e) {
      failed++;
      errors.push(e.message.slice(0, 60));
    }
  }));

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sent, failed, errors }),
  };
};
