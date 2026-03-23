// Server-side username save — uses service role key to bypass RLS.
// Validates the caller's JWT, checks username uniqueness, then updates public.users.
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')              || '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !serviceKey) {
    return new Response('Not configured', { status: 503 });
  }

  // Parse body
  let body;
  try { body = await req.json(); } catch (_) {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { username, jwt } = body;
  if (!username || !jwt) {
    return new Response('Missing required fields', { status: 400 });
  }

  // Validate username format
  if (!/^[a-zA-Z0-9_]{2,30}$/.test(username)) {
    return new Response('Invalid username format', { status: 400 });
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  // Verify the JWT to get the real user ID — call Supabase auth endpoint
  const authResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${jwt}` },
  });
  if (!authResp.ok) {
    return new Response('Unauthorized', { status: 401 });
  }
  const authUser = await authResp.json().catch(() => null);
  const userId = authUser?.id;
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check username uniqueness (case-insensitive)
  const checkResp = await fetch(
    `${supabaseUrl}/rest/v1/users?username=ilike.${encodeURIComponent(username)}&id=neq.${userId}&select=id&limit=1`,
    { headers }
  );
  const existing = await checkResp.json().catch(() => []);
  if (Array.isArray(existing) && existing.length > 0) {
    return new Response('Username taken', { status: 409 });
  }

  // Upsert the user row (insert if missing, update if exists)
  const upsertResp = await fetch(`${supabaseUrl}/rest/v1/users`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: userId, username }),
  });

  if (!upsertResp.ok) {
    const txt = await upsertResp.text().catch(() => '');
    return new Response('Could not save username: ' + txt, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, username }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = { path: '/save-username' };
