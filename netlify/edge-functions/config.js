export default function handler() {
  const key = Deno.env.get("ANTHROPIC_API_KEY") || "";
  return new Response(`window.ANTHROPIC_API_KEY = '${key}';`, {
    headers: { "content-type": "application/javascript" },
  });
}

export const config = { path: "/config.js" };
