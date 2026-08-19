// Concept render — the student DIRECTS, the model renders a finished 4-panel comic.
// Input: the rolled brief + a description (and optional reference image) for each of 4 panels.
// The creativity is the student's direction + iteration; assessment marks the direction, not one click.
// (Design: working/ai-feature-design.md §3, DECISION: polished auto-comic output.)
const { chatImage, guard } = require('./_openrouter');

const SYSTEM = `You are a comic illustrator. You render a single image that is a clean FOUR-PANEL comic strip
(2x2 grid, clear gutters, numbered 1-4) telling a short, wordless-friendly comedy in the student's style direction.
Follow the student's per-panel directions exactly. Keep it classroom-appropriate: no text/speech bubbles unless asked
(the student adds lettering later), no gore, no real logos. Consistent character design across all four panels.`;

// Enhance mode — the student has already BUILT the comic; the model polishes it.
// Their framing, panel order and story beats are the creative work being kept.
const ENHANCE_SYSTEM = `You are a comic illustrator. A student has assembled a four-panel comic (2x2 grid)
from found pictures — photos, engravings, paintings mixed together. FULLY REPAINT every one of the four
panels in ONE shared illustration style of your choosing: same linework, same palette, same rendering in
all four. No panel may remain photographic, engraved, or in its original medium. Keep the student's panel
order, compositions, subjects and story beats exactly as submitted, and keep the same main character
recognisable in every panel where it appears. Keep it wordless — no speech bubbles or added text.
Classroom-appropriate: no gore, no real logos, no real people.`;

module.exports = async function handler(req, res) {
  const body = await guard(req, res);
  if (!body) return;
  const { brief, panels, style, place, submissionDataUri } = body;

  // --- Enhance mode: a completed submission image + the rolled story ---
  if (typeof submissionDataUri === 'string' && submissionDataUri.startsWith('data:image/')) {
    let ePrompt = `Repaint the attached student-made four-panel comic (2x2 grid) as one cohesive,
polished strip in a single unified illustration style — every panel redrawn, none left in its original
medium. Preserve the student's framing choices, panel order and story beats.`;
    if (brief) ePrompt += `\nThe story it tells (make the four panels clearly land these beats): ${String(brief).slice(0, 300)}`;
    if (place) ePrompt += `\nWhere it happens: ${String(place).slice(0, 80)}`;
    if (style) ePrompt += `\nArt style: ${String(style).slice(0, 120)}`;
    ePrompt += `\nOutput a single 2x2 comic page with panels numbered 1-4. One consistent character design and palette across all four panels. Wordless.`;
    try {
      const imageUrl = await chatImage({
        system: ENHANCE_SYSTEM,
        contentParts: [
          { type: 'text', text: ePrompt },
          { type: 'image_url', image_url: { url: submissionDataUri } },
        ],
        // 55s: below Vercel's 60s maxDuration, so a slow render gets the friendly 502
        // below instead of a platform timeout.
        timeoutMs: 55000,
      });
      return res.status(200).json({ image: imageUrl });
    } catch (e) {
      return res.status(502).json({ error: 'The enhancer is unavailable right now. Your own comic is the real submission — this preview is a bonus.', detail: String(e).slice(0, 200) });
    }
  }

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
