// Vercel serverless proxy for ESPN public API
// Bypasses browser CORS restrictions by fetching server-side
export default async function handler(req, res) {
  const { url } = req.query;

  // Only allow ESPN API domains
  if (!url || !decodeURIComponent(url).startsWith('https://site.api.espn.com/')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const espnRes = await fetch(decodeURIComponent(url), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(9000),
    });

    if (!espnRes.ok) {
      return res.status(espnRes.status).json({ error: 'ESPN API error' });
    }

    const data = await espnRes.json();

    // Cache for 60s at the edge, serve stale for up to 30s while revalidating
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json(data);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
