// Server-side reaction handler — called by the service worker when a user taps
// the 👍 action button on a workout notification without opening the app.
// Uses the Supabase service role key so it can bypass RLS with its own validation:
//   1. Verify the signal exists and belongs to to_user_id
//   2. Verify an accepted friendship exists between from and to
//   3. Insert the reaction (idempotent — unique constraint prevents duplicates)
//   4. Send a push notification back to the workout owner
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')              || '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const appId       = Deno.env.get('ONESIGNAL_APP_ID')          || '';
  const apiKey      = Deno.env.get('ONESIGNAL_API_KEY')         || '';

  if (!supabaseUrl || !serviceKey) {
    return new Response('Not configured', { status: 503 });
  }

  let body;
  try {
    body = await req.json();
  } catch (_) {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { from_user_id, to_user_id, signal_id, reaction_type } = body;
  if (!from_user_id || !to_user_id || !signal_id) {
    return new Response('Missing required fields', { status: 400 });
  }

  const validTypes = ['thumbs_up', 'fist_bump', 'fire', 'checkmark'];
  const rxnType = validTypes.includes(reaction_type) ? reaction_type : 'thumbs_up';

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  // 1. Verify signal exists and belongs to to_user_id
  const signalResp = await fetch(
    `${supabaseUrl}/rest/v1/workout_signals?id=eq.${signal_id}&user_id=eq.${to_user_id}&select=id&limit=1`,
    { headers }
  );
  const signals = await signalResp.json().catch(() => []);
  if (!Array.isArray(signals) || signals.length === 0) {
    return new Response('Signal not found', { status: 404 });
  }

  // 2. Verify accepted friendship
  const fResp = await fetch(
    `${supabaseUrl}/rest/v1/friendships?status=eq.accepted&requester_id=eq.${from_user_id}&addressee_id=eq.${to_user_id}&select=id&limit=1`,
    { headers }
  );
  const f2Resp = await fetch(
    `${supabaseUrl}/rest/v1/friendships?status=eq.accepted&requester_id=eq.${to_user_id}&addressee_id=eq.${from_user_id}&select=id&limit=1`,
    { headers }
  );
  const [f1, f2] = await Promise.all([fResp.json().catch(() => []), f2Resp.json().catch(() => [])]);
  if (!f1.length && !f2.length) {
    return new Response('Not friends', { status: 403 });
  }

  // 3. Insert reaction (unique constraint on from_user_id + signal_id prevents duplicates)
  const rxnResp = await fetch(`${supabaseUrl}/rest/v1/reactions`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({ from_user_id, to_user_id, signal_id, reaction_type: rxnType }),
  });

  if (!rxnResp.ok && rxnResp.status !== 409) {
    return new Response('Could not save reaction', { status: 500 });
  }

  // 4. Notify the workout owner if they have a push subscription
  if (appId && apiKey) {
    try {
      const subResp = await fetch(
        `${supabaseUrl}/rest/v1/onesignal_subscriptions?user_id=eq.${to_user_id}&select=onesignal_player_id&limit=1`,
        { headers }
      );
      const subs = await subResp.json().catch(() => []);

      if (subs?.[0]?.onesignal_player_id) {
        const userResp = await fetch(
          `${supabaseUrl}/rest/v1/users?id=eq.${from_user_id}&select=display_name&limit=1`,
          { headers }
        );
        const users = await userResp.json().catch(() => []);
        const fromName = users?.[0]?.display_name || 'Someone';
        const emojiMap = { thumbs_up: '👍', fist_bump: '👊', fire: '🔥', checkmark: '✓' };
        const emoji = emojiMap[rxnType] || '👍';

        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Basic ${apiKey}` },
          body: JSON.stringify({
            app_id: appId,
            include_player_ids: [subs[0].onesignal_player_id],
            headings: { en: `${fromName} reacted to your workout` },
            contents: { en: `They gave you a ${emoji}` },
          }),
        }).catch(() => {});
      }
    } catch (_) {}
  }

  return new Response('OK', { status: 200 });
}

export const config = { path: '/record-reaction' };
