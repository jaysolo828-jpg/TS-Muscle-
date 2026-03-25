export default async function handler(req) {
  return new Response('push-send ok', { status: 200 });
}
export const config = { path: '/push-send' };
