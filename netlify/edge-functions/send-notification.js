import webpush from "npm:web-push";

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const vapidPublicKey  = Deno.env.get('VAPID_PUBLIC_KEY')  || '';
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
  const vapidSubject    = Deno.env.get('VAPID_SUBJECT')     || 'mailto:admin@therapyandsneakers.org';

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response('VAPID keys not configured', { status: 503 });
  }

  try {
    const { subscriptions, title, body, data: notifData } = await req.json();
    if (!subscriptions?.length) return new Response('Missing subscriptions', { status: 400 });

    const payload = JSON.stringify({
      title: title || 'T&S Muscle',
      body:  body  || '',
      data:  notifData || {},
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub => {
        if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return Promise.resolve();
        return webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
          payload,
          { vapidDetails: { subject: vapidSubject, publicKey: vapidPublicKey, privateKey: vapidPrivateKey } }
        );
      })
    );

    const errors = results.filter(r => r.status === 'rejected').map(r => r.reason?.message);
    return new Response(JSON.stringify({ sent: results.length, errors }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export const config = { path: '/send-notification' };
