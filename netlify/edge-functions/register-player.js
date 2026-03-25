// Validates a push subscription and returns it for client-side storage.
// The client saves endpoint + keys to Supabase onesignal_subscriptions.
export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { endpoint, keys, user_id } = await req.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }
    // Return the endpoint as the subscription id so the caller can store it
    return new Response(JSON.stringify({ id: endpoint }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export const config = { path: '/register-player' };
