export default function handler() {
  const appId = Deno.env.get('ONESIGNAL_APP_ID') || '';
  return new Response(`window.ONESIGNAL_APP_ID = '${appId}';`, {
    headers: { 'content-type': 'application/javascript' },
  });
}

export const config = { path: '/onesignal-config.js' };
