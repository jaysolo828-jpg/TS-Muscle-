export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const appId  = Deno.env.get('ONESIGNAL_APP_ID')  || '';
  const apiKey = Deno.env.get('ONESIGNAL_API_KEY') || '';

  if (!appId || !apiKey) {
    return new Response('Notifications not configured', { status: 503 });
  }

  try {
    const { player_id, from_name } = await req.json();
    if (!player_id) return new Response('Missing player_id', { status: 400 });

    const fromName = (from_name || 'Someone').slice(0, 60);

    const resp = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_player_ids: [player_id],
        headings: { en: 'T&S Muscle' },
        contents: { en: `${fromName} reacted to your workout` },
      }),
    });

    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.ok ? 200 : 500,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response('Internal error', { status: 500 });
  }
}

export const config = { path: '/send-notification' };
