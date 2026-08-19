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
const ENHANCE_SYSTEM = `You are a comic illustrator finishing a student's four-panel comic.

THE ATTACHED IMAGE IS THE GUIDE. It is a 2x2 grid of four panels the student assembled from found
pictures. Every element they put in a panel must appear in that panel of your version. What you add
is the world around those elements.

MUST KEEP — non-negotiable:
- Every subject, character, object and idea visible in a panel appears in that same panel. A dog stays
  a dog, a teapot stays a teapot, a cartoon character stays that character.
- The four panels stay in the same order, left to right, top to bottom.
- Once you consolidate several versions of a subject into one character, that character looks the
  same in every panel it appears in.

FREE TO ADD — this is where you do the work:
- Background, setting, scenery, weather, time of day, lighting and depth. A subject floating on white
  should be placed somewhere that makes sense for the story, and scaled to fill its panel.
- Staging and framing: where a subject sits in the panel, how close the view is, what surrounds it.
- Supporting detail that helps the four panels read as one continuous scene rather than four
  unrelated pictures — a room, a street, a horizon, a crowd, weather carried between panels.
- Different versions of a similar item (for example three different cats) can be consolidated into a
  single consistent character, as long as there are no more than three named characters across the
  whole page. If a panel holds many different subjects, that number can be approximated in your
  output rather than reproduced exactly.
- One shared illustration style across all four: same linework, same palette, same rendering, so a
  photo, an engraving and a cartoon end up looking like one artist drew the page.

NEVER:
- Never drop, replace or swap out an element the student chose.
- Never add a new main character, or any new subject that competes with theirs for attention. The one
  additional element permitted below is a prop or a piece of scenery, never a character.
- Never add speech bubbles, captions, sound effects, signage, labels or lettering of any kind. No text
  anywhere in the image, including on objects, walls, screens or signs.
- Nothing gory, sexual or demeaning, no real logos, no identifiable real people. Everything you draw
  must suit 13 and 14 year olds in a school classroom.`;

module.exports = async function handler(req, res) {
  const body = await guard(req, res, 'image');
  if (!body) return;
  const { brief, panels, style, place, submissionDataUri } = body;

  // --- Enhance mode: a completed submission image + the rolled story ---
  if (typeof submissionDataUri === 'string' && submissionDataUri.startsWith('data:image/')) {
    // The image leads the payload. An early version handed over the rolled story as
    // an instruction and the model illustrated the text instead of the picture — a
    // student's dog and cartoon panels came back as a badger on a school excursion.
    // So the brief is scoped to the WORLD around the elements, never to the elements.
    let ePrompt = `Finish the four-panel comic in the attached image.
Every element the student placed in a panel must appear in that panel of your version, in the same order.
Build the world around those elements: give them a setting, a background, lighting and depth so the four panels read as one continuous story in a single illustration style. Your output must suit 13 and 14 year olds in a school classroom.`;
    if (brief) ePrompt += `\nThe story the student is telling, to guide the SETTING and mood only: ${String(brief).slice(0, 250)}. Use it to decide where their elements are and what surrounds them. Do not use it to add or replace any subject. Up to one additional prop or scenery element may be added to support the story; it must not be a character.`;
    if (place) ePrompt += `\nStage the panels somewhere like: ${String(place).slice(0, 60)}.`;
    if (style) ePrompt += `\nStyle to aim for: ${String(style).slice(0, 120)}`;
    ePrompt += `\nOutput one 2x2 comic page. Same elements, same order, richer world, one consistent art style. Wordless.`;
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
