// Concept render — the student DIRECTS, the model renders a finished 4-panel comic.
// Input: the rolled brief + a description (and optional reference image) for each of 4 panels.
// The creativity is the student's direction + iteration; assessment marks the direction, not one click.
// (Design: working/ai-feature-design.md §3, DECISION: polished auto-comic output.)
const { chatImage, guard } = require('./_openrouter');

const SYSTEM = `You are a comic illustrator. You render a single image that is a clean FOUR-PANEL comic strip
(2x2 grid, clear gutters, numbered 1-4) telling a short, wordless-friendly comedy in the student's style direction.
Follow the student's per-panel directions exactly. Keep it classroom-appropriate: no text/speech bubbles unless asked
(the student adds lettering later), no gore, no real logos. Consistent character design across all four panels.`;

module.exports = async function handler(req, res) {
  const body = await guard(req, res);
  if (!body) return;
  const { brief, panels, style } = body;
  // Validate the same four entries the renderer will use. A sparse array like
  // [null, p1..p4] passed the old count check, then threw outside the try/catch.
  if (!Array.isArray(panels) || panels.length < 4 ||
      panels.slice(0, 4).some(p => !p || typeof p.description !== 'string' || !p.description.trim())) {
    return res.status(400).json({ error: 'Describe all four panels first.' });
  }

  // Compose the director's prompt from the student's own words.
  let prompt = `Render a four-panel comedy comic strip (2x2 grid, numbered 1-4).`;
  if (brief) prompt += `\nBrief: ${String(brief).slice(0, 300)}`;
  if (style) prompt += `\nArt style: ${String(style).slice(0, 120)}`;
  prompt += `\nPanels:`;
  panels.slice(0, 4).forEach((p, i) => {
    prompt += `\n${i + 1}. ${String(p.description).slice(0, 400)}`;
  });
  prompt += `\nKeep the character design consistent across all four panels. Leave room for the student to add speech bubbles later.`;

  // Build the multimodal content: the prompt, then any reference images the student supplied.
  const contentParts = [{ type: 'text', text: prompt }];
  panels.slice(0, 4).forEach((p) => {
    if (p && typeof p.imageDataUri === 'string' && p.imageDataUri.startsWith('data:image/')) {
      contentParts.push({ type: 'image_url', image_url: { url: p.imageDataUri } });
    }
  });

  try {
    // 55s, not 90s: vercel.json caps this function at 60s, so a 90s abort timer
    // could never fire — a slow render died as a platform timeout instead of the
    // friendly 502 below.
    const imageUrl = await chatImage({ system: SYSTEM, contentParts, timeoutMs: 55000 });
    res.status(200).json({ image: imageUrl });
  } catch (e) {
    res.status(502).json({ error: 'The renderer is unavailable right now. Sketch your four panels on paper instead — that is the real work anyway.', detail: String(e).slice(0, 200) });
  }
};
