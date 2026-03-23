// Netlify serverless function — saves username using service role key, bypassing RLS.
// Called at /.netlify/functions/save-username
const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const supabaseUrl = process.env.SUPABASE_URL              || '';
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceKey) {
    return { statusCode: 503, body: 'Not configured' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (_) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { username, jwt } = body;
  if (!username || !jwt) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  if (!/^[a-zA-Z0-9_]{2,30}$/.test(username)) {
    return { statusCode: 400, body: 'Invalid username format' };
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  // Verify JWT to get real user ID
  const authResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${jwt}` },
  });
  if (!authResp.ok) {
    return { statusCode: 401, body: 'Unauthorized' };
  }
  const authUser = await authResp.json().catch(() => null);
  const userId = authUser?.id;
  if (!userId) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // Check username uniqueness (case-insensitive)
  const checkResp = await fetch(
    `${supabaseUrl}/rest/v1/users?username=ilike.${encodeURIComponent(username)}&id=neq.${userId}&select=id&limit=1`,
    { headers }
  );
  const existing = await checkResp.json().catch(() => []);
  if (Array.isArray(existing) && existing.length > 0) {
    return { statusCode: 409, body: 'Username taken' };
  }

  // Upsert the user row
  const upsertResp = await fetch(`${supabaseUrl}/rest/v1/users`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: userId, username }),
  });

  if (!upsertResp.ok) {
    const txt = await upsertResp.text().catch(() => '');
    return { statusCode: 500, body: 'Could not save username: ' + txt };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, username }),
  };
};

exports.handler = handler;
