export default async function handler(req) {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
  if (!vapidPublicKey) {
    return new Response(JSON.stringify({ vapid_public_key: null, error: 'VAPID_PUBLIC_KEY not set' }), {
      status: 503, headers: { 'content-type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ vapid_public_key: vapidPublicKey }), {
    status: 200, headers: { 'content-type': 'application/json' },
  });
}

export const config = { path: '/get-vapid-key' };
