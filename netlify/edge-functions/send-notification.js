export default async function handler(req) {
  const url = new URL(req.url);
  // Payload is in the path: /sn/<base64url>
  const parts = url.pathname.split('/').filter(Boolean);
  const d = parts[1] || '';
  return new Response(
    JSON.stringify({ reached: true, has_d: !!d, d_len: d.length }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

export const config = { path: '/sn/*' };
