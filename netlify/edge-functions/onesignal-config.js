export default function handler() {
  const appId      = Deno.env.get('ONESIGNAL_APP_ID')   || '';
  const vapidKey   = Deno.env.get('VAPID_PUBLIC_KEY')    || '';
  return new Response(
    `window.ONESIGNAL_APP_ID = '${appId}';\nwindow.VAPID_PUBLIC_KEY = '${vapidKey}';`,
    { headers: { 'content-type': 'application/javascript' } }
  );
}

export const config = { path: '/onesignal-config.js' };
