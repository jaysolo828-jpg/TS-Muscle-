export default async function handler() {
  // Allow explicit override — most reliable path.
  // Set ONESIGNAL_VAPID_PUBLIC_KEY in Netlify env vars to skip the API call.
  const direct = Deno.env.get('ONESIGNAL_VAPID_PUBLIC_KEY') || '';
  if (direct) {
    return new Response(JSON.stringify({ vapid_public_key: direct }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const appId  = Deno.env.get('ONESIGNAL_APP_ID') || '';
  if (!appId) {
    return new Response(JSON.stringify({ error: 'ONESIGNAL_APP_ID not set', vapid_public_key: null }), {
      status: 503, headers: { 'content-type': 'application/json' },
    });
  }

  // The OneSignal web SDK fetches app config without an API key (VAPID public key is public).
  // Try unauthenticated first, then fall back to REST API key if set.
  const apiKey = Deno.env.get('ONESIGNAL_API_KEY') || '';
  const attempts = [
    fetch(`https://api.onesignal.com/apps/${appId}`),
    ...(apiKey ? [fetch(`https://api.onesignal.com/apps/${appId}`, { headers: { 'Authorization': `Basic ${apiKey}` } })] : []),
  ];

  for (const attempt of attempts) {
    try {
      const resp = await attempt;
      const text = await resp.text();
      let data = {};
      try { data = JSON.parse(text); } catch(_) {}
      if (data.vapid_public_key) {
        return new Response(JSON.stringify({ vapid_public_key: data.vapid_public_key }), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      }
    } catch(_) {}
  }

  return new Response(JSON.stringify({
    vapid_public_key: null,
    error: 'VAPID key not found. Set ONESIGNAL_VAPID_PUBLIC_KEY in Netlify env vars.',
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

export const config = { path: '/get-vapid-key' };
