export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const appId  = Deno.env.get('ONESIGNAL_APP_ID')  || '';
  const apiKey = Deno.env.get('ONESIGNAL_API_KEY') || '';
  if (!appId || !apiKey) return new Response('Not configured', { status: 503 });

  try {
    const { endpoint, keys, user_id } = await req.json();
    if (!endpoint || !keys) return new Response('Missing fields', { status: 400 });

    const resp = await fetch('https://api.onesignal.com/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        device_type: 5,
        identifier: endpoint,
        web_auth: keys.auth,
        web_p256: keys.p256dh,
        external_user_id: user_id,
      }),
    });

    const result = await resp.json();
    return new Response(JSON.stringify(result), {
      status: resp.ok ? 200 : 500,
      headers: { 'content-type': 'application/json' },
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export const config = { path: '/register-player' };
