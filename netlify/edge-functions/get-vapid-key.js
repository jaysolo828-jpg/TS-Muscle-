export default async function handler(req) {
  const url = new URL(req.url);
  const d   = url.searchParams.get('d');

  const pubKey  = Deno.env.get('VAPID_PUBLIC_KEY')          || '';
  const privKey = Deno.env.get('VAPID_PRIVATE_KEY')         || '';
  const subject = Deno.env.get('VAPID_SUBJECT')             || 'mailto:admin@therapyandsneakers.org';
  const sbUrl   = Deno.env.get('SUPABASE_URL')              || '';
  const sbKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!d) {
    if (!pubKey) return new Response(JSON.stringify({ error: 'VAPID_PUBLIC_KEY not set' }), { status: 503, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({ vapid_public_key: pubKey }), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  try {
    const enc = new TextEncoder();

    function b64u(buf) {
      const bytes = new Uint8Array(buf);
      let str = '';
      for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
      return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    }

    function fromb64u(s) {
      const b64 = s.replace(/-/g,'+').replace(/_/g,'/');
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
      const saltKey = await crypto.subtle.importKey('raw', salt, { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
      const prk = new Uint8Array(await crypto.subtle.sign('HMAC', saltKey, ikm));
      const prkKey = await crypto.subtle.importKey('raw', prk, { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
      const result = new Uint8Array(len);
      let prev = new Uint8Array(0);
      let off = 0;
      for (let i = 1; off < len; i++) {
        prev = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, concat(prev, info, new Uint8Array([i]))));
        result.set(prev.subarray(0, Math.min(prev.length, len - off)), off);
        off += prev.length;
      }
      return result;
    }

    async function encryptWebPush(p256dhB64u, authB64u, payload) {
      const uaPublic = fromb64u(p256dhB64u);
      const uaAuth   = fromb64u(authB64u);
      const senderKey = await crypto.subtle.generateKey({ name:'ECDH', namedCurve:'P-256' }, true, ['deriveBits']);
      const asPublic  = new Uint8Array(await crypto.subtle.exportKey('raw', senderKey.publicKey));
      const uaKey     = await crypto.subtle.importKey('raw', uaPublic, { name:'ECDH', namedCurve:'P-256' }, false, []);
      const ecdhBits  = new Uint8Array(await crypto.subtle.deriveBits({ name:'ECDH', public: uaKey }, senderKey.privateKey, 256));
      const info = concat(enc.encode('WebPush: info\x00'), uaPublic, asPublic);
      const ikm  = await hkdf(uaAuth, ecdhBits, info, 32);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const cek   = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\x00'), 16);
      const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\x00'), 12);
      const cekKey = await crypto.subtle.importKey('raw', cek, { name:'AES-GCM', length:128 }, false, ['encrypt']);
      const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name:'AES-GCM', iv: nonce }, cekKey, concat(enc.encode(payload), new Uint8Array([2]))));
      const rs = new Uint8Array(4);
      new DataView(rs.buffer).setUint32(0, 4096, false);
      return concat(salt, rs, new Uint8Array([65]), asPublic, ciphertext);
    }

    async function vapidJwt(endpoint) {
      const pub = fromb64u(pubKey);
      const key = await crypto.subtle.importKey('jwk',
        { kty:'EC', crv:'P-256', d: privKey, x: b64u(pub.slice(1,33)), y: b64u(pub.slice(33,65)) },
        { name:'ECDSA', namedCurve:'P-256' }, false, ['sign']);
      const audience = new URL(endpoint).origin;
      const hdr = b64u(enc.encode(JSON.stringify({ alg:'ES256', typ:'JWT' })));
      const pay = b64u(enc.encode(JSON.stringify({ aud: audience, exp: Math.floor(Date.now()/1000)+43200, sub: subject })));
      const sig = new Uint8Array(await crypto.subtle.sign({ name:'ECDSA', hash:'SHA-256' }, key, enc.encode(`${hdr}.${pay}`)));
      return `vapid t=${hdr}.${pay}.${b64u(sig)},k=${pubKey}`;
    }

    // Decode ?d= param
    let uid, title, body, sid;
    try {
      const p = JSON.parse(new TextDecoder().decode(fromb64u(d)));
      uid = p.uid; title = p.title || 'T&S Muscle'; body = p.body || ''; sid = p.sid || '';
    } catch(e) {
      return new Response(JSON.stringify({ error: 'bad d: ' + e.message }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (!uid) return new Response(JSON.stringify({ error: 'missing uid' }), { status: 200, headers: { 'content-type': 'application/json' } });
    if (!pubKey || !privKey) return new Response(JSON.stringify({ error: 'VAPID not configured' }), { status: 200, headers: { 'content-type': 'application/json' } });
    if (!sbUrl || !sbKey) return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 200, headers: { 'content-type': 'application/json' } });

    const sbHeaders = { apikey: sbKey, Authorization: 'Bearer ' + sbKey };

    // Get friend IDs
    const frResp = await fetch(`${sbUrl}/rest/v1/friendships?select=requester_id,addressee_id&status=eq.accepted&or=(requester_id.eq.${uid},addressee_id.eq.${uid})`, { headers: sbHeaders });
    const friendships = frResp.ok ? await frResp.json() : [];
    if (!friendships.length) return new Response(JSON.stringify({ sent: 0, info: 'no friends' }), { status: 200, headers: { 'content-type': 'application/json' } });

    const friendIds = friendships.map(f => f.requester_id === uid ? f.addressee_id : f.requester_id);

    // Get push subscriptions
    const subsResp = await fetch(`${sbUrl}/rest/v1/onesignal_subscriptions?select=push_endpoint,push_p256dh,push_auth&user_id=in.(${friendIds.join(',')})&push_endpoint=not.is.null`, { headers: sbHeaders });
    const subs = subsResp.ok ? await subsResp.json() : [];
    if (!subs.length) return new Response(JSON.stringify({ sent: 0, info: 'no subs' }), { status: 200, headers: { 'content-type': 'application/json' } });

    const notifPayload = JSON.stringify({ title, body, data: sid ? { signal_id: sid, to_user_id: uid } : {} });

    const results = await Promise.allSettled(subs.map(async (sub, i) => {
      const encrypted = await encryptWebPush(sub.push_p256dh, sub.push_auth, notifPayload).catch(e => { throw new Error('encrypt: ' + e.message); });
      const auth = await vapidJwt(sub.push_endpoint).catch(e => { throw new Error('vapid: ' + e.message); });
      const r = await fetch(sub.push_endpoint, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/octet-stream', 'Content-Encoding': 'aes128gcm', TTL: '86400' },
        body: encrypted,
      });
      if (!r.ok) throw new Error('FCM ' + r.status + ': ' + (await r.text().catch(() => '')).slice(0, 80));
      return r.status;
    }));

    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const errors = results.filter(r => r.status === 'rejected').map(r => r.reason?.message || String(r.reason));
    return new Response(JSON.stringify({ sent, errors }), { status: 200, headers: { 'content-type': 'application/json' } });

  } catch(e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
}

export const config = { path: '/get-vapid-key' };
