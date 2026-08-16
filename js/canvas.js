/* Comic Builder — a cheap-Canva compositor for a four-panel wordless comic.
   Search G-rated GIFs (server-proxied, rating locked to g), then in each of four
   frames layer multiple image items and editable speech bubbles, and export a PNG.
   Class-password gated. Persists to localStorage (device-only).
   ponytail: vanilla JS, no libraries. Pointer Events cover mouse + iPad touch with
   one code path; no drag library. */
(function () {
  'use strict';
  var PASS_KEY = 'ff-class-pass';   // sessionStorage — this session only
  var STATE_KEY = 'ff-comic';       // localStorage — survives refresh, device only
  var CREDITS_KEY = 'ff-credits';   // localStorage — one credit line for each frame
  var NFRAMES = 4;
  var HINTS = ['Setup', 'Escalation', 'Escalation', 'Punchline'];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var pass = sessionStorage.getItem(PASS_KEY) || '';

  var comic = load();               // [{items:[...]}, x4]
  var active = 0;                   // active frame index
  var idSeq = 1;                    // item id counter
  var maxZ = 0;                     // z-index high-water mark
  var frameEls = [];                // rendered frame DOM nodes

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function nextId() { return idSeq++; }
  function nextZ() { return ++maxZ; }
  function announce(m) { var l = $('#live'); if (l) l.textContent = m; }

  // ---- persistence --------------------------------------------------------
  function emptyComic() {
    return Array.from({ length: NFRAMES }, function () { return { items: [] }; });
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STATE_KEY));
      if (s && Array.isArray(s.frames) && s.frames.length === NFRAMES) {
        return s.frames.map(function (f) {
          var items = (f && Array.isArray(f.items)) ? f.items : [];
          return {
            items: items.filter(function (it) { return it && (it.type === 'image' || it.type === 'bubble' || it.type === 'caption'); })
              .map(function (it) {
                return {
                  id: 0, type: it.type, src: it.src || '', text: it.text || '',
                  x: +it.x || 0, y: +it.y || 0,
                  w: it.w ? +it.w : 45, h: it.h ? +it.h : 30, z: +it.z || 0
                };
              })
          };
        });
      }
    } catch (e) {}
    return emptyComic();
  }
  function serialize() {
    return { frames: comic.map(function (f) {
      return { items: f.items.map(function (it) {
        return { type: it.type, src: it.src, text: it.text, x: it.x, y: it.y, w: it.w, h: it.h, z: it.z };
      }) };
    }) };
  }
  function save() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(serialize()));
      $('#save-notice').textContent = '';
    } catch (e) {
      // data-URL uploads can blow the ~5MB quota; don't crash, just warn.
      $('#save-notice').textContent = 'Too big to auto-save — export your comic now to keep it.';
    }
  }

  function creditSlots() { return Array.prototype.slice.call(document.querySelectorAll('[data-credit-slot]')); }
  function loadCredits() {
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem(CREDITS_KEY) || '[]'); } catch (e) {}
    creditSlots().forEach(function (slot, i) { slot.value = typeof saved[i] === 'string' ? saved[i] : ''; });
  }
  function saveCredits() {
    try { localStorage.setItem(CREDITS_KEY, JSON.stringify(creditSlots().map(function (slot) { return slot.value; }))); } catch (e) {}
  }
  function clearCredits() {
    creditSlots().forEach(function (slot) { slot.value = ''; });
    try { localStorage.removeItem(CREDITS_KEY); } catch (e) {}
    var message = $('#credit-msg');
    if (message) message.textContent = 'Credits cleared for your new comic.';
  }
  function copyCredits() {
    var slots = creditSlots();
    var lines = slots.map(function (slot) { return slot.value.trim(); });
    var message = $('#credit-msg');
    var firstBlank = lines.findIndex(function (line) { return !line; });
    if (firstBlank > -1) {
      message.textContent = 'Add the exact credit for Frame ' + (firstBlank + 1) + ' before you copy.';
      slots[firstBlank].focus();
      return;
    }
    var text = lines.map(function (line, i) { return 'Frame ' + (i + 1) + ': ' + line; }).join('\n');
    function done() { message.textContent = 'Copied all four credits. Open the class wall, post your comic, then paste these lines underneath.'; }
    function fallback() {
      var copyBox = document.createElement('textarea');
      copyBox.value = text;
      copyBox.setAttribute('aria-label', 'Your four copied credit lines');
      copyBox.style.position = 'fixed'; copyBox.style.left = '-9999px';
      document.body.appendChild(copyBox); copyBox.select();
      var copied = false;
      try { copied = document.execCommand('copy'); } catch (e) {}
      if (copied) { document.body.removeChild(copyBox); done(); }
      else {
        message.textContent = 'Your four credits are selected. Press Ctrl+C or Cmd+C, then open the class wall.';
        copyBox.style.position = 'static'; copyBox.style.left = 'auto'; copyBox.style.width = '100%';
        copyBox.focus();
      }
    }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, fallback); }
    else { fallback(); }
  }
  function startCredits() {
    var button = $('#copy-credits');
    if (!button) return;
    loadCredits();
    creditSlots().forEach(function (slot) { slot.addEventListener('input', saveCredits); });
    button.addEventListener('click', copyCredits);
  }

  // normalise ids + z once, after load
  comic.forEach(function (f) { f.items.forEach(function (it) {
    it.id = nextId();
    if (it.z > maxZ) maxZ = it.z; else it.z = nextZ();
  }); });

  // ---- gate ---------------------------------------------------------------
  // Show the rolled story (from 2 Roll, via localStorage 'ff-brief') pinned at
  // the top, so the student always knows what goes in the four frames. If they
  // came straight here without rolling, offer a box to paste/type it.
  function renderBrief() {
    var box = $('#cb-brief'); if (!box) return;
    var brief = null;
    try { brief = JSON.parse(localStorage.getItem('ff-brief') || 'null'); } catch (e) {}
    var line = brief && (brief.text ||
      [brief.character, brief.situation, brief.problem].filter(Boolean).join(' · '));
    box.innerHTML = '';
    if (line) {
      var lab = document.createElement('p'); lab.className = 'cb-brief__label';
      lab.textContent = 'Your story — put this across the four frames';
      var val = document.createElement('p'); val.className = 'cb-brief__line';
      val.textContent = line;
      box.appendChild(lab); box.appendChild(val);
    } else {
      var l = document.createElement('label'); l.className = 'cb-brief__label';
      l.setAttribute('for', 'cb-brief-in');
      l.textContent = 'Your story (paste it from 2 Roll — or type it here)';
      var inp = document.createElement('input'); inp.id = 'cb-brief-in'; inp.type = 'text';
      inp.placeholder = 'character · situation · problem';
      inp.addEventListener('input', function () {
        try { localStorage.setItem('ff-brief', JSON.stringify({ text: inp.value })); } catch (e) {}
      });
      box.appendChild(l); box.appendChild(inp);
    }
  }

  function unlock(guest) {
    $('#gate-section').hidden = true;
    $('#tool').hidden = false;
    $('#search-section').hidden = !!guest;
    $('#build-comic').hidden = !guest;
    $('#guest-note').hidden = !guest;
    renderBrief();
    renderFrames();
    var step = document.querySelector('.step-pill[href="' + (guest ? '#build-comic' : '#search-section') + '"]');
    if (step) step.click();
  }

  async function tryPass(candidate) {
    var r = await fetch('/api/gifs?q=hello', { headers: { 'x-class-pass': candidate } });
    return r.ok;
  }

  if (pass) { unlock(); }
  else if (location.hash === '#search-section' || location.hash === '#build-comic') {
    // A guest preview is deliberately not remembered. On refresh, return a locked visitor to
    // the visible gate instead of letting the pager hide it behind a stale preview fragment.
    history.replaceState(null, '', location.pathname + location.search);
  }

  $('#gate-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var val = $('#gate-input').value.trim();
    $('#gate-msg').textContent = 'Checking…';
    var ok = await tryPass(val).catch(function () { return null; });
    if (ok) { pass = val; sessionStorage.setItem(PASS_KEY, val); $('#gate-msg').textContent = ''; unlock(); }
    else if (ok === false) { $('#gate-msg').textContent = 'That password didn’t work. Check with your teacher.'; }
    else { $('#gate-msg').textContent = 'Couldn’t reach the class server. Try again.'; }
  });

  $('#guest-mode').addEventListener('click', function () {
    unlock(true);
    announce('Guest mode is open. Add your own picture, make bubbles and download your comic.');
  });

  // ---- motion choice (animated / still) -----------------------------------
  function motionStill() { var el = $('#motion-still'); return !!(el && el.checked); }
  function motionWord() { return motionStill() ? 'still' : 'animated'; }
  // when the choice changes, re-word any result buttons already on screen
  Array.prototype.forEach.call(document.querySelectorAll('input[name="motion"]'), function (r) {
    r.addEventListener('change', function () {
      Array.prototype.forEach.call($('#results').children, function (b) {
        var t = b.getAttribute('data-title') || 'untitled';
        b.setAttribute('aria-label', 'Add ' + motionWord() + ' picture to frame ' + (active + 1) + ': ' + t);
      });
    });
  });

  // ---- search -------------------------------------------------------------
  $('#search-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var q = $('#search-input').value.trim();
    if (!q) return;
    var msg = $('#search-msg'); var grid = $('#results');
    msg.textContent = 'Searching…'; grid.innerHTML = '';
    try {
      var r = await fetch('/api/gifs?q=' + encodeURIComponent(q), { headers: { 'x-class-pass': pass } });
      if (r.status === 401) { msg.textContent = 'The class password expired. Reload and enter it again.'; return; }
      var data = await r.json();
      if (!r.ok || !data.gifs || !data.gifs.length) { msg.textContent = data.error || 'Nothing came up. Try another word.'; return; }
      msg.textContent = '';
      data.gifs.forEach(function (g) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-title', g.title || 'untitled');
        b.setAttribute('aria-label', 'Add ' + motionWord() + ' picture to frame ' + (active + 1) + ': ' + (g.title || 'untitled'));
        var im = document.createElement('img');
        im.src = g.preview; im.alt = ''; im.loading = 'lazy';
        b.appendChild(im);
        b.addEventListener('click', function () {
          var src = motionStill() ? (g.still || g.full) : g.full;
          addImageItem(src, g.title || 'GIF');
        });
        grid.appendChild(b);
      });
    } catch (err) { msg.textContent = 'Search is unavailable right now.'; }
  });

  // ---- adding items -------------------------------------------------------
  function addImageItem(src, title) {
    var it = { id: nextId(), type: 'image', src: src, text: title || '', x: 20, y: 18, w: 50, h: 55, z: nextZ() };
    comic[active].items.push(it);
    renderFrames(); save();
    announce('Added a picture to frame ' + (active + 1) + '.');
    $('#place-msg').textContent = 'Added to frame ' + (active + 1) + '. Drag it, resize the corner, or add more.';
  }

  function addBubble(kind) {
    var it = { id: nextId(), type: kind, src: '', text: '', x: 16, y: 20, w: 52, h: 24, z: nextZ() };
    comic[active].items.push(it);
    renderFrames(); save();
    announce('Added a ' + (kind === 'bubble' ? 'speech bubble' : 'caption') + ' to frame ' + (active + 1) + '. Type your words.');
    var el = frameEls[active] && frameEls[active].querySelector('[data-id="' + it.id + '"] .citem__text');
    if (el) el.focus();
  }

  $('#add-pic-btn').addEventListener('click', function () { $('#add-pic').click(); });
  $('#add-pic').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file || file.type.indexOf('image') !== 0) return;
    var reader = new FileReader();
    reader.onload = function () { addImageItem(reader.result, file.name); };
    reader.readAsDataURL(file);
  });
  $('#add-bubble').addEventListener('click', function () { addBubble('bubble'); });
  $('#add-caption').addEventListener('click', function () { addBubble('caption'); });

  // PASTE an image straight in
  document.addEventListener('paste', function (e) {
    if ($('#tool').hidden) return;
    var items = (e.clipboardData && e.clipboardData.items) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image') === 0) {
        var file = items[i].getAsFile();
        if (file) {
          var r = new FileReader();
          r.onload = function () { addImageItem(r.result, 'Pasted picture'); };
          r.readAsDataURL(file);
          e.preventDefault();
        }
        break;
      }
    }
  });

  // ---- selection + active frame ------------------------------------------
  function deselectAll() {
    Array.prototype.forEach.call(document.querySelectorAll('.citem.is-selected'), function (n) {
      n.classList.remove('is-selected');
    });
  }
  function activate(i) {
    active = i;
    frameEls.forEach(function (fe, idx) { fe.classList.toggle('is-active', idx === i); });
    announce('Frame ' + (i + 1) + ' is active.');
    $('#place-msg').textContent = 'Frame ' + (i + 1) + ' is active. Add a picture or a speech bubble.';
  }
  function selectItem(el, item, fi) {
    deselectAll();
    el.classList.add('is-selected');
    item.z = nextZ(); el.style.zIndex = item.z;
    if (fi !== active) activate(fi);
    save();
  }

  function removeItem(fi, item, el) {
    var arr = comic[fi].items;
    var idx = arr.indexOf(item);
    if (idx > -1) arr.splice(idx, 1);
    if (el && el.parentNode) el.parentNode.removeChild(el);
    // if frame is now empty, re-render to bring the hint back
    if (!arr.length) renderFrames();
    save();
    announce('Removed an item from frame ' + (fi + 1) + '.');
  }

  // ---- rendering ----------------------------------------------------------
  function applyPos(el, it) {
    el.style.left = it.x + '%'; el.style.top = it.y + '%';
    el.style.width = it.w + '%'; el.style.height = it.h + '%';
  }

  function makeItemEl(it, fi, frameEl) {
    var el = document.createElement('div');
    el.className = 'citem citem--' + it.type;
    el.dataset.id = it.id;
    el.tabIndex = 0;
    el.style.zIndex = it.z;
    applyPos(el, it);

    if (it.type === 'image') {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', 'Picture: ' + (it.text || 'image') + '. Drag to move, arrow keys to nudge.');
      var im = document.createElement('img');
      im.src = it.src; im.alt = it.text || ''; im.draggable = false;
      el.appendChild(im);
    } else {
      var label = it.type === 'bubble' ? 'Speech bubble' : 'Caption';
      el.setAttribute('aria-label', label + '. Press Enter to edit the text, arrow keys to nudge.');
      var text = document.createElement('div');
      text.className = 'citem__text';
      text.contentEditable = 'true';
      text.setAttribute('role', 'textbox');
      text.setAttribute('aria-label', label + ' text');
      text.setAttribute('data-placeholder', it.type === 'bubble' ? 'Say something…' : 'Caption…');
      text.textContent = it.text || '';
      text.addEventListener('input', function () { it.text = text.textContent; save(); });
      // keep the bubble activated while typing, but don't let typing move it
      text.addEventListener('pointerdown', function (e) { e.stopPropagation(); activate(fi); selectItem(el, it, fi); });
      el.appendChild(text);
    }

    // delete button
    var del = document.createElement('button');
    del.type = 'button'; del.className = 'citem__del'; del.textContent = '×';
    del.setAttribute('aria-label', 'Delete this item');
    del.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    del.addEventListener('click', function (e) { e.stopPropagation(); removeItem(fi, it, el); });
    el.appendChild(del);

    // resize handle (bottom-right)
    var handle = document.createElement('div');
    handle.className = 'citem__handle'; handle.setAttribute('aria-hidden', 'true');
    el.appendChild(handle);
    wireResize(handle, el, it, frameEl);

    wireDrag(el, it, fi, frameEl);
    wireKeys(el, it, fi);
    return el;
  }

  function wireDrag(el, it, fi, frameEl) {
    var startX, startY, origX, origY, rect, dragging, pid;
    el.addEventListener('pointerdown', function (e) {
      if (e.target.classList.contains('citem__handle') || e.target.classList.contains('citem__del')) return;
      selectItem(el, it, fi);
      pid = e.pointerId;
      rect = frameEl.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY; origX = it.x; origY = it.y;
      dragging = false;
    });
    el.addEventListener('pointermove', function (e) {
      if (pid === undefined || e.pointerId !== pid) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) + Math.abs(dy) < 4) return;
        dragging = true;
        var a = document.activeElement;
        if (a && el.contains(a) && a !== el) a.blur();
        try { el.setPointerCapture(pid); } catch (_) {}
      }
      e.preventDefault();
      it.x = clamp(origX + dx / rect.width * 100, 0, 100 - it.w);
      it.y = clamp(origY + dy / rect.height * 100, 0, 100 - it.h);
      el.style.left = it.x + '%'; el.style.top = it.y + '%';
    });
    function end(e) {
      if (pid === undefined) return;
      try { el.releasePointerCapture(pid); } catch (_) {}
      var was = dragging; pid = undefined; dragging = false;
      if (was) save();
      else if (it.type !== 'image') { var t = el.querySelector('.citem__text'); if (t) t.focus(); }
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function wireResize(handle, el, it, frameEl) {
    var rect, pid;
    handle.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); e.preventDefault();
      pid = e.pointerId;
      rect = frameEl.getBoundingClientRect();
      try { handle.setPointerCapture(pid); } catch (_) {}
    });
    handle.addEventListener('pointermove', function (e) {
      if (pid === undefined || e.pointerId !== pid) return;
      e.preventDefault();
      var nw = (e.clientX - rect.left) / rect.width * 100 - it.x;
      var nh = (e.clientY - rect.top) / rect.height * 100 - it.y;
      it.w = clamp(nw, 8, 100 - it.x);
      it.h = clamp(nh, 8, 100 - it.y);
      el.style.width = it.w + '%'; el.style.height = it.h + '%';
    });
    function end() {
      if (pid === undefined) return;
      try { handle.releasePointerCapture(pid); } catch (_) {}
      pid = undefined; save();
    }
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  function wireKeys(el, it, fi) {
    el.addEventListener('keydown', function (e) {
      if (e.target !== el) return; // don't hijack keys while editing text
      var STEP = 3, moved = false;
      switch (e.key) {
        case 'ArrowLeft':  if (e.shiftKey) it.w = clamp(it.w - STEP, 8, 100 - it.x); else it.x = clamp(it.x - STEP, 0, 100 - it.w); moved = true; break;
        case 'ArrowRight': if (e.shiftKey) it.w = clamp(it.w + STEP, 8, 100 - it.x); else it.x = clamp(it.x + STEP, 0, 100 - it.w); moved = true; break;
        case 'ArrowUp':    if (e.shiftKey) it.h = clamp(it.h - STEP, 8, 100 - it.y); else it.y = clamp(it.y - STEP, 0, 100 - it.h); moved = true; break;
        case 'ArrowDown':  if (e.shiftKey) it.h = clamp(it.h + STEP, 8, 100 - it.y); else it.y = clamp(it.y + STEP, 0, 100 - it.h); moved = true; break;
        case 'Delete': case 'Backspace': e.preventDefault(); removeItem(fi, it, el); return;
        case 'Enter':
          if (it.type !== 'image') { var t = el.querySelector('.citem__text'); if (t) { t.focus(); e.preventDefault(); } }
          return;
        default: return;
      }
      if (moved) { e.preventDefault(); applyPos(el, it); if (!el.classList.contains('is-selected')) selectItem(el, it, fi); save(); }
    });
    el.addEventListener('focus', function () { if (fi !== active) activate(fi); });
  }

  function renderFrames() {
    var wrap = $('#frames'); wrap.innerHTML = ''; frameEls = [];
    comic.forEach(function (f, i) {
      var frame = document.createElement('div');
      frame.className = 'frame' + (i === active ? ' is-active' : '');
      frame.tabIndex = 0;
      frame.setAttribute('role', 'group');
      frame.setAttribute('aria-label', 'Frame ' + (i + 1) + ': ' + HINTS[i] + '. Press Enter or Space to make it active.');

      var num = document.createElement('span');
      num.className = 'frame__num'; num.textContent = i + 1;
      frame.appendChild(num);

      if (!f.items.length) {
        var hint = document.createElement('div');
        hint.className = 'frame__hint'; hint.textContent = HINTS[i];
        frame.appendChild(hint);
      }

      // click on empty part activates + deselects
      frame.addEventListener('pointerdown', function (e) {
        if (e.target === frame || e.target.classList.contains('frame__hint')) {
          activate(i); deselectAll();
        }
      });
      frame.addEventListener('keydown', function (e) {
        if (e.target !== frame || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        activate(i); deselectAll();
        announce('Frame ' + (i + 1) + ' is active.');
      });

      f.items.forEach(function (it) { frame.appendChild(makeItemEl(it, i, frame)); });

      wrap.appendChild(frame);
      frameEls.push(frame);
    });
  }

  // ---- clear all ----------------------------------------------------------
  $('#clear-btn').addEventListener('click', function () {
    if (!window.confirm('Clear every frame? This cannot be undone.')) return;
    comic = emptyComic(); active = 0; maxZ = 0;
    renderFrames(); save(); clearCredits();
    announce('Cleared all four frames.');
    $('#place-msg').textContent = 'Frame 1 is active. Add a picture or a speech bubble.';
  });

  // ---- export -------------------------------------------------------------
  // ponytail: GIPHY's CDN generally allows CORS, so drawImage exports fine. If a
  // picture ever taints the canvas, the upgrade path is a same-origin image proxy
  // (fetch the bytes server-side and re-serve them) so the export never taints.
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrapText(ctx, text, cx, cy, maxW, lh) {
    var words = text.split(/\s+/), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    var startY = cy - (lines.length * lh) / 2 + lh / 2;
    for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], cx, startY + j * lh);
  }
  function drawBubble(ctx, it, x, y, w, h) {
    var r = Math.min(20, h * 0.3, w * 0.3);
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.lineWidth = it.type === 'bubble' ? 5 : 3;
    ctx.strokeStyle = it.type === 'bubble' ? '#14141C' : '#5b5b66';
    ctx.stroke();
    if (it.type === 'bubble') {
      ctx.beginPath();
      ctx.moveTo(x + w * 0.22, y + h - 4);
      ctx.lineTo(x + w * 0.20, y + h + 22);
      ctx.lineTo(x + w * 0.40, y + h - 4);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF'; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#14141C'; ctx.stroke();
    }
    var txt = (it.text || '').trim();
    if (!txt) return;
    ctx.fillStyle = '#14141C';
    var fs = Math.max(16, Math.min(30, h * 0.28));
    ctx.font = (it.type === 'bubble' ? 'bold ' : '') + fs + 'px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    wrapText(ctx, txt, x + w / 2, y + h / 2, w - 20, fs * 1.25);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  function textIsSafeToExport() {
    var words = comic.map(function (frame) {
      return frame.items.filter(function (item) { return item.type !== 'image'; })
        .map(function (item) { return item.text || ''; }).join(' ');
    }).join(' ');
    if (!words.trim()) return true;
    if (/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b|\b(?:\+?61|0)\d[\d\s-]{7,}\b/.test(words)) {
      $('#export-msg').textContent = 'Take out contact details before you download. Keep real people private.';
      return false;
    }
    if (!window.confirm('Quick name check: are all names made-up characters, not students, teachers, friends or anyone you know?')) {
      $('#export-msg').textContent = 'Edit the words first. Keep real people out of the comic.';
      return false;
    }
    return true;
  }

  $('#export-btn').addEventListener('click', function () {
    var msg = $('#export-msg'); msg.textContent = 'Building your comic…';
    var CELL_W = 600, CELL_H = 450, GAP = 18;
    var W = CELL_W * 2 + GAP * 3, H = CELL_H * 2 + GAP * 3;
    var anyItem = comic.some(function (f) { return f.items.length; });
    if (!anyItem) { msg.textContent = 'Add a picture or a bubble to a frame first.'; return; }
    if (!textIsSafeToExport()) return;

    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#FFF9F0'; ctx.fillRect(0, 0, W, H);

    // preload all image items, then draw everything in z-order
    var imgItems = [];
    comic.forEach(function (f) { f.items.forEach(function (it) { if (it.type === 'image') imgItems.push(it); }); });
    var loaded = {}, pending = imgItems.length, anyFail = false;

    function fail() {
      msg.textContent = 'Couldn’t save an image (a picture blocked it). Take a screenshot instead — on a Mac, Shift-Cmd-4.';
    }
    function afterLoad() { try { draw(); } catch (e) { fail(); } }

    if (pending === 0) afterLoad();
    else imgItems.forEach(function (it) {
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function () { loaded[it.id] = im; if (--pending === 0) afterLoad(); };
      im.onerror = function () { anyFail = true; if (--pending === 0) afterLoad(); };
      im.src = it.src;
    });

    function draw() {
      for (var i = 0; i < NFRAMES; i++) {
        var col = i % 2, row = Math.floor(i / 2);
        var fx = GAP + col * (CELL_W + GAP), fy = GAP + row * (CELL_H + GAP);
        ctx.fillStyle = '#FFF9F0'; ctx.fillRect(fx, fy, CELL_W, CELL_H);
        ctx.strokeStyle = '#14141C'; ctx.lineWidth = 6; ctx.strokeRect(fx + 3, fy + 3, CELL_W - 6, CELL_H - 6);

        var items = comic[i].items.slice().sort(function (a, b) { return a.z - b.z; });
        items.forEach(function (it) {
          var dx = fx + (it.x / 100) * CELL_W, dy = fy + (it.y / 100) * CELL_H;
          var dw = (it.w / 100) * CELL_W, dh = (it.h / 100) * CELL_H;
          if (it.type === 'image') {
            var im = loaded[it.id];
            if (im && im.width) {
              var s = Math.min(dw / im.width, dh / im.height);
              var iw = im.width * s, ih = im.height * s;
              try { ctx.drawImage(im, dx + (dw - iw) / 2, dy + (dh - ih) / 2, iw, ih); } catch (e) { anyFail = true; }
            }
          } else {
            drawBubble(ctx, it, dx, dy, dw, dh);
          }
        });
      }
      var url;
      try { url = cv.toDataURL('image/png'); } catch (e) { fail(); return; }
      if (!url) { fail(); return; }
      var a = document.createElement('a');
      a.href = url; a.download = 'four-frames-comic.png';
      document.body.appendChild(a); a.click(); a.remove();
      msg.textContent = anyFail
        ? 'Saved your comic — but a picture was skipped. Screenshot if you need it exact.'
        : 'Saved your comic to Downloads.';
    }
  });

  // first paint if already unlocked
  startCredits();
  if (pass) renderFrames();
})();
