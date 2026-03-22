export default function handler() {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  return new Response(
    `window.SUPABASE_URL = '${url}'; window.SUPABASE_PUBLISHABLE_KEY = '${key}';`,
    { headers: { "content-type": "application/javascript" } }
  );
}

export const config = { path: "/supabase-config.js" };
