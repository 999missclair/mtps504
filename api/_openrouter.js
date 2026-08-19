// Shared OpenRouter helper for the MTPS504 site's AI features.
// The key lives ONLY here, server-side (process.env.OPENROUTER_API_KEY) — never shipped to the browser.
// ponytail: one helper, three endpoints. No SDK — a fetch and two model ids is the whole job.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Models (override with env if OpenRouter renames them).
const TEXT_MODEL = process.env.AI_TEXT_MODEL || 'google/gemini-2.5-flash';
const IMAGE_MODEL = process.env.AI_IMAGE_MODEL || 'google/gemini-2.5-flash-image';

function key() {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) throw new Error('OPENROUTER_API_KEY is not set');
  return k;
}

function headers() {
  return {
    'Authorization': `Bearer ${key()}`,
    'Content-Type': 'application/json',
    // OpenRouter asks for these; harmless if the domain differs.
    'HTTP-Referer': 'https://four-frames.vercel.app',
    'X-Title': 'Four Frames MTPS504',
  };
}

async function callOpenRouter(payload, timeoutMs = 60000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      throw new Error(`OpenRouter ${r.status}: ${body.slice(0, 300)}`);
    }
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

// Text feature: returns the assistant's text.
async function chatText({ system, user, maxTokens = 400, temperature = 0.7 }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user });
  const data = await callOpenRouter({
    model: TEXT_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
  });
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

// Image feature: content may include image parts. Returns a data: URI for the generated image.
async function chatImage({ system, contentParts, timeoutMs = 90000 }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: contentParts });
  const data = await callOpenRouter(
    { model: IMAGE_MODEL, messages, modalities: ['image', 'text'] },
    timeoutMs,
  );
  const msg = data?.choices?.[0]?.message || {};
  const imgs = msg.images || [];
  if (imgs.length) {
    const first = imgs[0];
    if (first?.image_url?.url) return first.image_url.url;
    if (first?.url) return first.url;
    if (typeof first === 'string') return first;
  }
  throw new Error('No image returned by the model');
}

// Tiny best-effort per-instance rate limit (resets on cold start). ponytail: an in-memory Map,
// not Redis — a class of 26 doesn't need distributed limiting; upgrade only if it ever ships wider.
//
// A whole school sits behind one NAT, so "per IP" is really "per class". At 20/min a Year 8
// lesson exhausted the budget for everyone at once, mid-task, and the AI helpers failed for the
// room rather than for the one student clicking too fast. The limits below are sized for a class
// of thirty rather than for one person, and split by cost: the text helpers are cheap and get a
// generous ceiling, the image renderer is the one that spends real money and keeps a tight one.
// The gate that actually stops strangers is the class password, checked before this; this is a
// runaway-loop brake on the API bill, not an access control. Overridable by env so a bigger
// cohort is a dashboard change, not a deploy.
//
// Deliberately NOT per student: the site keeps no accounts, sets no cookies and issues no device
// token, and the submitted assessment says so. A shared bucket is the honest cost of that.
const HITS = new Map();
const num = (v, fallback) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : fallback);
const LIMITS = {
  text: num(process.env.RATE_LIMIT_TEXT, 150),   // a class of 30 at 5 asks a minute
  image: num(process.env.RATE_LIMIT_IMAGE, 45),  // the expensive one: ~1.5 renders each a minute
};
function rateLimited(ip, bucket = 'text', windowMs = 60000) {
  const limit = LIMITS[bucket] || LIMITS.text;
  const now = Date.now();
  const key = bucket + '|' + ip;
  const rec = HITS.get(key) || { n: 0, reset: now + windowMs };
  if (now > rec.reset) { rec.n = 0; rec.reset = now + windowMs; }
  rec.n += 1;
  HITS.set(key, rec);
  // The Map is per warm instance and would otherwise grow for the life of it.
  if (HITS.size > 500) {
    for (const [k, v] of HITS) if (now > v.reset) HITS.delete(k);
  }
  return rec.n > limit;
}

// Class-password gate. If CLASS_PASSWORD is set (production), every /api call must send a matching
// x-class-pass header — checked server-side, so the live tools won't serve without the teacher's
// password. If unset (local dev), it's open. ponytail: one shared secret, header-checked — "simple
// gating for education use", exactly what was asked, and honest that it isn't high-security auth.
function classPassOk(req) {
  const want = process.env.CLASS_PASSWORD;
  if (!want) return true;
  return ((req.headers['x-class-pass'] || '').trim() === want);
}

// Shared request guard: POST only, class password, JSON body, rate limit. Returns parsed body or null.
// `bucket` picks which budget the call is charged to — 'text' (cheap) or 'image' (expensive).
async function guard(req, res, bucket = 'text') {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return null;
  }
  if (!classPassOk(req)) {
    res.status(401).json({ error: 'Enter the class password to use this.' });
    return null;
  }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip, bucket)) {
    res.status(429).json({ error: 'The class is asking a lot at once. Wait a moment and try again.' });
    return null;
  }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  return body || {};
}

module.exports = { chatText, chatImage, guard, classPassOk, TEXT_MODEL, IMAGE_MODEL };
