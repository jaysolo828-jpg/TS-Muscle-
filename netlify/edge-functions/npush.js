export default async function handler(req) {
  return new Response('npush ok', { status: 200 });
}
export const config = { path: '/npush' };
