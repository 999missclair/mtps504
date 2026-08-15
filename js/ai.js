/* Four Frames — AI helpers front-end.
   Three scaffolds, one shared gate. Each widget wires itself only if its
   markup is on the page (same progressive-enhancement pattern as drawer.js /
   canvas.js). The class password lives in sessionStorage under one key shared
   with the GIF canvas, and is sent as the x-class-pass header — the OpenRouter
   key never touches the browser (see api/_openrouter.js).

   Pedagogy (working/ai-feature-design.md): the AI helps students THINK, PLAN
   and PREVIEW. It never replaces the making. Idea = questions, not answers.
   Alt-text = a draft to check and fix. Render = "a rough guess to argue with".

   ponytail: vanilla JS, no framework. Presence-guarded init, not an engine. */
(function () {
  'use strict';

  var PASS_KEY = 'ff-class-pass'; // shared with js/canvas.js
  var gateSeq = 0;

  // --- shared fetch: sends the class pass, flags a 401 as "needs password" ---
  async function aiFetch(endpoint, body) {
    var pass = sessionStorage.getItem(PASS_KEY) || '';
    var r = await fetch('/api/' + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-class-pass': pass },
      body: JSON.stringify(body),
    });
    if (r.status === 401) { var e = new Error('pass'); e.needPass = true; throw e; }
    var data = await r.json().catch(function () { return {}; });
    if (!r.ok) { var e2 = new Error(data.error || 'unavailable'); e2.friendly = data.error; throw e2; }
    return data;
  }

  // --- inline class-password gate (accessible: real label + input) ----------
  function gate(panel, retry) {
    var g = panel.querySelector('.ai-gate');
    if (!g) {
      var id = 'ai-gate-' + (++gateSeq);
      g = document.createElement('form');
      g.className = 'ai-gate';
      g.innerHTML =
        '<label for="' + id + '">Class password</label>' +
        '<input id="' + id + '" type="password" autocomplete="off" inputmode="text">' +
        '<button type="submit" class="btn-secondary">Unlock</button>' +
        '<p class="ai-gate__msg small" role="status"></p>';
      panel.appendChild(g);
      g.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = g.querySelector('input').value.trim();
        if (!v) return;
        sessionStorage.setItem(PASS_KEY, v);
        g.hidden = true;
        retry();
      });
    }
    g.hidden = false;
    g.querySelector('.ai-gate__msg').textContent = 'Ask your teacher for the class password.';
    g.querySelector('input').focus();
  }

  // Run an async action, managing the button + the gate + a friendly error.
  async function guarded(panel, btn, fn) {
    if (btn) btn.disabled = true;
    try {
      await fn();
    } catch (err) {
      if (err && err.needPass) { gate(panel, function () { guarded(panel, btn, fn); }); }
      else { msg(panel, (err && err.friendly) || 'The helper is asleep — use the fallback below.'); }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function msg(panel, text) {
    var out = panel.querySelector('.ai-out');
    if (out) { out.hidden = false; out.textContent = text; }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // ========================================================================
  // 1. IDEA HELPER (2 Roll) — asks 2–3 questions about the locked brief.
  // ========================================================================
  var ideaPanel = document.querySelector('[data-ai-idea]');
  if (ideaPanel) {
    var ideaBtn = ideaPanel.querySelector('[data-ai-idea-go]');
    var ideaOut = ideaPanel.querySelector('.ai-out');
    if (ideaBtn && ideaOut) {
      ideaBtn.addEventListener('click', function () {
        var briefEl = document.querySelector('[data-dice-brief-text]');
        var brief = (briefEl ? briefEl.textContent : '').trim();
        if (!brief) {
          ideaOut.hidden = false;
          ideaOut.textContent = 'Roll and lock your brief first — then I can ask about it.';
          return;
        }
        var parts = brief.split(' · ');
        ideaOut.hidden = false; ideaOut.textContent = 'Thinking of some questions…';
        guarded(ideaPanel, ideaBtn, async function () {
          var data = await aiFetch('idea', {
            character: (parts[0] || '').trim(),
            situation: (parts[1] || '').trim(),
            problem: (parts[2] || '').trim(),
            brief: brief,
          });
          ideaOut.textContent = '';
          var lines = String(data.questions || '').split('\n').map(function (l) {
            return l.replace(/^\s*[-\d.)]+\s*/, '').trim();
          }).filter(Boolean);
          var ul = el('ul', 'ai-questions');
          lines.forEach(function (l) { ul.appendChild(el('li', null, l)); });
          ideaOut.appendChild(el('p', 'small', 'Questions to push YOUR idea — the comic is still yours to make.'));
          ideaOut.appendChild(ul);
        });
      });
    }
  }

  // ========================================================================
  // 2. ALT-TEXT HELPER (4 Build / 5 Share) — draft alt text + caption to EDIT.
  // ========================================================================
  var altPanel = document.querySelector('[data-ai-alt]');
  if (altPanel) {
    var altIn = altPanel.querySelector('[data-ai-alt-in]');
    var altBtn = altPanel.querySelector('[data-ai-alt-go]');
    var altOut = altPanel.querySelector('.ai-out');
    if (altIn && altBtn && altOut) {
      altBtn.addEventListener('click', function () {
        var desc = altIn.value.trim();
        if (!desc) { altOut.hidden = false; altOut.textContent = 'Describe your panel first, in your own words.'; altIn.focus(); return; }
        altOut.hidden = false; altOut.textContent = 'Drafting…';
        guarded(altPanel, altBtn, async function () {
          var data = await aiFetch('alt-text', { description: desc });
          altOut.textContent = '';
          altOut.appendChild(el('p', 'small', 'The AI drafted this. Read it, then fix anything that is wrong — you are the check.'));
          altOut.appendChild(field('Alt text (what the panel shows)', data.alt || '', 'ai-alt-out-alt'));
          altOut.appendChild(field('Caption (optional, under the panel)', data.caption || '', 'ai-alt-out-cap'));
        });
      });
    }
  }

  // A labelled, editable output field (the student owns the final words).
  function field(labelText, value, id) {
    var wrap = el('div', 'ai-field');
    var lab = el('label', null, labelText); lab.setAttribute('for', id);
    var inp = el('input'); inp.id = id; inp.type = 'text'; inp.value = value;
    wrap.appendChild(lab); wrap.appendChild(inp);
    return wrap;
  }

  // ========================================================================
  // 3. CONCEPT RENDER (3 Plan → 4 Build) — the student DIRECTS four panels.
  // ========================================================================
  var renPanel = document.querySelector('[data-ai-render]');
  if (renPanel) {
    var renBtn = renPanel.querySelector('[data-ai-render-go]');
    var renOut = renPanel.querySelector('.ai-out');
    if (renBtn && renOut) {
      renBtn.addEventListener('click', function () {
        var briefEl = document.querySelector('[data-dice-brief-text]');
        var brief = (renPanel.querySelector('[data-ai-render-brief]') || {}).value ||
                    (briefEl ? briefEl.textContent : '') || '';
        var style = (renPanel.querySelector('[data-ai-render-style]') || {}).value || '';
        var panels = Array.prototype.map.call(
          renPanel.querySelectorAll('[data-ai-render-panel]'),
          function (t) { return { description: t.value.trim() }; }
        );
        if (panels.filter(function (p) { return p.description; }).length < 4) {
          renOut.hidden = false; renOut.textContent = 'Write a direction for all four panels first.';
          return;
        }
        renOut.hidden = false; renOut.textContent = 'Rendering your rough preview… this can take a moment.';
        guarded(renPanel, renBtn, async function () {
          var data = await aiFetch('render', { brief: brief.trim(), style: style.trim(), panels: panels });
          renOut.textContent = '';
          var img = el('img', 'ai-render-img'); img.src = data.image; img.alt = 'A rough four-panel preview of your comic, drawn by the AI from your directions.';
          renOut.appendChild(img);
          renOut.appendChild(el('p', 'ai-guardrail', 'This is the machine’s guess. It will get your joke slightly wrong. Your job on 4 Build is to do it better — in your own frames.'));
        });
      });
    }
  }
})();
