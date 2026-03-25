const webpush = require('web-push');

exports.handler = async function(event) {
  // Health check
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ alive: true }),
    };
  }

  const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY           || '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY          || '';
  const vapidSubject    = process.env.VAPID_SUBJECT              || 'mailto:admin@therapyandsneakers.org';
  const supabaseUrl     = process.env.SUPABASE_URL               || '';
  const serviceKey      = process.env.SUPABASE_SERVICE_ROLE_KEY  || '';

  if (!vapidPublicKey || !vapidPrivateKey || !supabaseUrl || !serviceKey) {
    return { statusCode: 503, body: 'Not configured' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (_) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // uid = sender, notifies all friends
  // to_uid = specific recipient (for reactions)
  const { uid, to_uid, title, body: msgBody, sid } = body;
  if (!uid && !to_uid) {
    return { statusCode: 400, body: 'Missing uid or to_uid' };
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  let targetUserIds = [];

  if (to_uid) {
    targetUserIds = [to_uid];
  } else {
    // Get all accepted friends of uid
    const [f1Resp, f2Resp] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/friendships?status=eq.accepted&requester_id=eq.${uid}&select=addressee_id`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/friendships?status=eq.accepted&addressee_id=eq.${uid}&select=requester_id`, { headers }),
    ]);
    const [f1, f2] = await Promise.all([
      f1Resp.json().catch(() => []),
      f2Resp.json().catch(() => []),
    ]);
    targetUserIds = [
      ...f1.map(r => r.addressee_id),
      ...f2.map(r => r.requester_id),
    ];
  }

  if (!targetUserIds.length) {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sent: 0, reason: 'no targets' }),
    };
  }

  // Get push subscriptions for all target users
  const subsResp = await fetch(
    `${supabaseUrl}/rest/v1/onesignal_subscriptions?user_id=in.(${targetUserIds.join(',')})&push_endpoint=not.is.null&select=user_id,push_endpoint,push_p256dh,push_auth`,
    { headers }
  );
  const subs = await subsResp.json().catch(() => []);

  if (!Array.isArray(subs) || !subs.length) {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sent: 0, reason: 'no subscriptions' }),
    };
  }

  const payload = JSON.stringify({
    title: title || 'T&S Muscle',
    body: msgBody || '',
    data: sid ? { signal_id: sid, to_user_id: uid || to_uid } : {},
  });

  let sent = 0, failed = 0;
  await Promise.all(subs.map(async sub => {
    if (!sub.push_endpoint || !sub.push_p256dh || !sub.push_auth) return;
    try {
      await webpush.sendNotification(
        { endpoint: sub.push_endpoint, keys: { p256dh: sub.push_p256dh, auth: sub.push_auth } },
        payload
      );
      sent++;
    } catch (e) {
      failed++;
    }
  }));

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sent, failed }),
  };
};
