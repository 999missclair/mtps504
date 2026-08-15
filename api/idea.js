// Idea helper — a DIVERGENT SCAFFOLD, not a story writer.
// Given the rolled brief, it asks 2-3 questions to push the student's own idea further.
// It never writes the four panels. (Design: working/ai-feature-design.md §1.)
const { chatText, guard } = require('./_openrouter');

const SYSTEM = `You are a warm, brief studio assistant for a Year 8 Visual Arts class making a four-frame comedy comic.
A student gives you their rolled brief: a CHARACTER, a SITUATION and a PROBLEM.
Your ONLY job is to ask 2-3 short questions that help them develop THEIR OWN idea.
HARD RULES:
- Do NOT write the comic. Do NOT describe the four panels. Do NOT give them the joke.
- Ask questions, don't give answers. Each question opens a choice, not a solution.
- Stay strictly inside the three cards they were dealt — never swap the character, situation or problem.
- Keep it to 2-3 questions, one line each, plain UK English, no preamble, no emoji.
- Aim at where the comedy or the twist could live.`;

module.exports = async function handler(req, res) {
  const body = await guard(req, res);
  if (!body) return;
  const { character, situation, problem } = body;
  if (!character || !situation || !problem) {
    return res.status(400).json({ error: 'Need character, situation and problem.' });
  }
  try {
    const user = `CHARACTER: ${character}\nSITUATION: ${situation}\nPROBLEM: ${problem}\n\nAsk me 2-3 questions to develop my own four-frame comic.`;
    const text = await chatText({ system: SYSTEM, user, maxTokens: 250, temperature: 0.8 });
    res.status(200).json({ questions: text });
  } catch (e) {
    res.status(502).json({ error: 'The idea helper is unavailable right now. Try the "Stuck? Try this" box instead.', detail: String(e).slice(0, 200) });
  }
};
