// Supabase Edge Function: resolve-song
// Proxies the Songlink/Odesli API to avoid CORS restrictions in the browser.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing url' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = 'https://api.song.link/v1-alpha.1/links?url=' + encodeURIComponent(url);
    const resp = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'upstream_error', status: resp.status }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    if (!data || !data.entityUniqueId || !data.entitiesByUniqueId) {
      return new Response(JSON.stringify({ error: 'no_match' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const entity = data.entitiesByUniqueId[data.entityUniqueId];
    if (!entity || (!entity.title && !entity.artistName)) {
      return new Response(JSON.stringify({ error: 'no_metadata' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const links: Record<string, string> = {};
    for (const [platform, info] of Object.entries(data.linksByPlatform || {})) {
      const i = info as { url?: string };
      if (i && i.url) links[platform] = i.url;
    }

    return new Response(JSON.stringify({
      title: entity.title || 'Unknown Title',
      artist: entity.artistName || '',
      artwork_url: entity.thumbnailUrl || null,
      platform_links: links,
      odesli_key: data.entityUniqueId || null,
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'internal', message: String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
