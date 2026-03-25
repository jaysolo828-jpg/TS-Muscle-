const webpush = require('web-push');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY  || '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
  const vapidSubject    = process.env.VAPID_SUBJECT     || 'mailto:admin@therapyandsneakers.org';

  if (!vapidPublicKey || !vapidPrivateKey) {
    return { statusCode: 503, body: 'VAPID keys not configured' };
  }

  try {
    const { subscriptions, title, body, data: notifData } = JSON.parse(event.body);
    if (!subscriptions?.length) return { statusCode: 400, body: 'Missing subscriptions' };

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
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sent: results.length, errors }),
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
