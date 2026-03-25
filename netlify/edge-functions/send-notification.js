export default async function handler(req) {
  return new Response(
    JSON.stringify({ reached: true, method: req.method }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

export const config = { path: '/send-notification' };
