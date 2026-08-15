// Describe-your-panel / alt-text helper — an ACCESSIBILITY + AI-LITERACY scaffold.
// The student describes a panel (in words); the AI drafts alt-text + a caption they then EDIT.
// The output is a proposal to approve or fix, never final. (Design: working/ai-feature-design.md §2.)
const { chatText, guard } = require('./_openrouter');

const SYSTEM = `You help a Year 8 student write ALT TEXT and a short CAPTION for one panel of their comic.
The student describes their panel in their own words. You return exactly two things:
1) ALT TEXT — one factual sentence describing what is visually in the panel, for someone who cannot see it. No interpretation of the joke, just what is shown. Under 125 characters.
2) CAPTION — an optional short caption (max 8 words) that could sit under the panel.
RULES: plain UK English, no emoji, no preamble. This is a DRAFT for the student to check and fix — write it so it is easy to edit.
Format your reply exactly as:
ALT: <alt text>
CAPTION: <caption>`;

module.exports = async function handler(req, res) {
  const body = await guard(req, res);
  if (!body) return;
  const { description } = body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Describe your panel first.' });
  }
  try {
    const user = `My panel: ${description.trim()}`;
    const text = await chatText({ system: SYSTEM, user, maxTokens: 150, temperature: 0.5 });
    // Best-effort split; front-end also shows the raw text so nothing is lost.
    const alt = (text.match(/ALT:\s*(.+)/i) || [])[1]?.trim() || '';
    const caption = (text.match(/CAPTION:\s*(.+)/i) || [])[1]?.trim() || '';
    res.status(200).json({ alt, caption, raw: text });
  } catch (e) {
    res.status(502).json({ error: 'The alt-text helper is unavailable right now. Write it in your own words — one sentence on what the panel shows.', detail: String(e).slice(0, 200) });
  }
};
