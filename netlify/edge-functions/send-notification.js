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
    const { player_ids, title, body, buttons, data: notifData, send_after } = await req.json();
    if (!player_ids?.length) return new Response('Missing player_ids', { status: 400 });

    const payload = {
      app_id: appId,
      include_subscription_ids: player_ids,
      headings: { en: (title || 'T&S Muscle').slice(0, 80) },
      contents: { en: (body || '').slice(0, 160) },
    };

    // Action buttons (e.g. 👍 Nice work on workout notifications)
    if (buttons?.length) payload.buttons = buttons;
    // Custom data passed through to the notification (e.g. signal_id, to_user_id)
    if (notifData) payload.data = notifData;
    // Schedule delivery at a future time (ISO 8601) so notifications fire
    // even when the client browser is backgrounded or the screen is locked.
    if (send_after) payload.send_after = send_after;

    const resp = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await resp.json();
    return new Response(JSON.stringify(result), {
      status: resp.ok ? 200 : 500,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response('Internal error', { status: 500 });
  }
}

export const config = { path: '/send-notification' };
