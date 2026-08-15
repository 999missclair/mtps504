// Giphy search proxy — the key stays server-side, and the rating is LOCKED to G.
// The browser calls /api/gifs?q=...&offset=...; it can never widen the rating.
// (Design: working/gif-canvas-design.md.) Attribution "Powered By GIPHY" is required
// wherever results are shown — the front-end renders it.
const { classPassOk } = require('./_openrouter');
const GIPHY = 'https://api.giphy.com/v1/gifs/search';

module.exports = async function handler(req, res) {
  if (!classPassOk(req)) return res.status(401).json({ error: 'Enter the class password to use this.' });
  const q = (req.query && req.query.q) || '';
  const offset = Math.max(0, parseInt((req.query && req.query.offset) || '0', 10) || 0);
  if (!q.trim()) return res.status(400).json({ error: 'Type what you are looking for.' });

  const key = process.env.GIPHY_API_KEY;
  if (!key) return res.status(500).json({ error: 'GIPHY_API_KEY is not set.' });

  // rating LOCKED to g. bundle keeps payloads small; lang en.
  const url = `${GIPHY}?api_key=${encodeURIComponent(key)}&q=${encodeURIComponent(q.slice(0,80))}`
    + `&rating=g&limit=24&offset=${offset}&lang=en&bundle=messaging_non_clips`;

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Giphy ${r.status}`);
    const data = await r.json();
    // Trim to what the canvas needs; drop anything not rated g (defence in depth).
    const gifs = (data.data || [])
      .filter(g => (g.rating || 'g') === 'g')
      .map(g => ({
        id: g.id,
        title: g.title || '',
        preview: g.images?.fixed_height_small?.url || g.images?.fixed_height?.url,
        full: g.images?.fixed_height?.url || g.images?.original?.url,
        w: parseInt(g.images?.fixed_height?.width || '0', 10),
        h: parseInt(g.images?.fixed_height?.height || '0', 10),
      }))
      .filter(g => g.preview && g.full);
    res.setHeader('Cache-Control', 's-maxage=600');
    res.status(200).json({ gifs, offset, total: data.pagination?.total_count ?? gifs.length });
  } catch (e) {
    res.status(502).json({ error: 'GIF search is unavailable right now.', detail: String(e).slice(0, 160) });
  }
};
