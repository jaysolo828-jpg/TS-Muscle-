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

  const appId  = Deno.env.get('ONESIGNAL_APP_ID')  || '';
  const apiKey = Deno.env.get('ONESIGNAL_API_KEY') || '';
  if (!appId) return new Response(JSON.stringify({ error: 'ONESIGNAL_APP_ID not set', vapid_public_key: null }), { status: 503, headers: { 'content-type': 'application/json' } });

  try {
    // Try with REST API key first (works if key has app-read permission)
    const headers = apiKey ? { 'Authorization': `Basic ${apiKey}` } : {};
    const resp = await fetch(`https://api.onesignal.com/apps/${appId}`, { headers });
    const text = await resp.text();
    let data = {};
    try { data = JSON.parse(text); } catch(_) {}

    const vapidKey = data.vapid_public_key || null;
    return new Response(JSON.stringify({
      vapid_public_key: vapidKey,
      api_status: resp.status,
      // surface errors so the client can show a useful toast
      api_error: (!vapidKey && data.errors) ? JSON.stringify(data.errors).slice(0, 120) : null,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message, vapid_public_key: null }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}

export const config = { path: '/get-vapid-key' };
