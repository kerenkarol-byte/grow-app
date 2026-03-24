// Server-side proxy for the iTunes Search API.
// Apple blocks CORS requests from browser origins, so this Vercel serverless
// function makes the iTunes call server-side and forwards the JSON response.
// Deployed automatically by Vercel at /api/podcasts.
export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ results: [] });

  try {
    const url =
      `https://itunes.apple.com/search?media=podcast&entity=podcast` +
      `&term=${encodeURIComponent(q)}&limit=20`;

    const upstream = await fetch(url);
    if (!upstream.ok) return res.status(200).json({ results: [] });

    const data = await upstream.json();

    // Cache the response at Vercel's CDN edge for 1 hour so repeated identical
    // queries are served without hitting iTunes.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(data);
  } catch {
    // Never let a proxy failure crash the caller — return an empty result set.
    return res.status(200).json({ results: [] });
  }
}
