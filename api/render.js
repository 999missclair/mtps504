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
const ENHANCE_SYSTEM = `You are a comic illustrator redrawing a student's existing four-panel comic.

THE ATTACHED IMAGE IS THE AUTHORITY. It is a 2x2 grid of four panels the student assembled from found
pictures. Your job is to REDRAW WHAT IS ALREADY THERE in one consistent illustration style.

Absolute rules:
- Look at each of the four panels in the attached image. Whatever subject is in a panel, redraw THAT
  subject in that panel. A dog stays a dog. A cartoon character stays that character. A person in a hat
  stays a person in a hat.
- DO NOT invent new characters, animals, settings, crowds or events. If it is not visible in the
  attached image, it does not go in your picture.
- Keep the four panels in the same order, left to right, top to bottom.
- If the student's picture sits small inside a panel, fill that panel with the same subject rather than
  copying the empty space around it.
- Unify only the STYLE: one linework, one palette, one rendering across all four, so a photo, a cartoon
  and a painting end up looking like one artist drew them.
- Wordless. No speech bubbles, no captions, no added text.
- Classroom-appropriate: no gore, no real logos, no identifiable real people.`;

module.exports = async function handler(req, res) {
  const body = await guard(req, res);
  if (!body) return;
  const { brief, panels, style, place, submissionDataUri } = body;

  // --- Enhance mode: a completed submission image + the rolled story ---
  if (typeof submissionDataUri === 'string' && submissionDataUri.startsWith('data:image/')) {
    // The image goes first in contentParts and the text is deliberately thin:
    // an earlier version told the model to "land these beats" from the rolled
    // story, and it duly ignored the picture and illustrated the brief instead —
    // a student's dog and cartoon panels came back as a badger on a school trip.
    let ePrompt = `Redraw the four panels in the attached image, keeping the same subject in each panel, in one shared illustration style.`;
    if (style) ePrompt += `\nStyle to aim for: ${String(style).slice(0, 120)}`;
    ePrompt += `\nOutput one 2x2 comic page, panels in the same order as the attached image. Same subjects, new consistent art style. Wordless.`;
    // The brief and place are mood only, and are named as such, because as
    // instructions they overrode what was actually in the picture.
    if (brief) ePrompt += `\nFor mood only, the student says their story is: ${String(brief).slice(0, 200)}. Do not add anything from this sentence that is not already visible in the image.`;
    if (place) ePrompt += `\nMood only, not an instruction to add it: ${String(place).slice(0, 60)}.`;
    try {
      const imageUrl = await chatImage({
        system: ENHANCE_SYSTEM,
        contentParts: [
          { type: 'image_url', image_url: { url: submissionDataUri } },
          { type: 'text', text: ePrompt },
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
