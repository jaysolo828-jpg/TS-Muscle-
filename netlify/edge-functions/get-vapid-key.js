export default async function handler() {
  const appId  = Deno.env.get('ONESIGNAL_APP_ID')  || '';
  const apiKey = Deno.env.get('ONESIGNAL_API_KEY') || '';
  if (!appId || !apiKey) return new Response('Not configured', { status: 503 });

  try {
    const resp = await fetch(`https://api.onesignal.com/apps/${appId}`, {
      headers: { 'Authorization': `Basic ${apiKey}` },
    });
    const data = await resp.json();
    return new Response(JSON.stringify({ vapid_public_key: data.vapid_public_key || null }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export const config = { path: '/get-vapid-key' };
