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
  var DESCRIPTION_KEY = 'ff-comic-description'; // localStorage — image description for the class wall
  var EXPORT_KEY = 'ff-comic-downloaded'; // device-only handoff to 5 Share
  var NFRAMES = 4;
  var HINTS = ['Setup', 'Escalation', 'Escalation', 'Punchline'];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var pass = sessionStorage.getItem(PASS_KEY) || '';

  var comic = load();               // [{items:[...]}, x4]
  var active = 0;                   // active frame index
  var idSeq = 1;                    // item id counter
  var maxZ = 0;                     // z-index high-water mark
  var frameEls = [];                // rendered frame DOM nodes
  var lastClear = null;             // one in-memory recovery snapshot; refresh deliberately clears it

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
  function comicDescription() { return $('#comic-alt-text'); }
  function loadComicDescription() {
    var field = comicDescription();
    if (!field) return;
    try { field.value = localStorage.getItem(DESCRIPTION_KEY) || ''; } catch (e) {}
  }
  function saveComicDescription() {
    var field = comicDescription();
    if (!field) return;
    try {
      if (field.value) localStorage.setItem(DESCRIPTION_KEY, field.value);
      else localStorage.removeItem(DESCRIPTION_KEY);
    } catch (e) {}
  }
  function clearComicDescription() {
    var field = comicDescription();
    if (field) field.value = '';
    try { localStorage.removeItem(DESCRIPTION_KEY); } catch (e) {}
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
    loadCredits();
    loadComicDescription();
    creditSlots().forEach(function (slot) { slot.addEventListener('input', saveCredits); });
    var description = comicDescription();
    if (description) description.addEventListener('input', saveComicDescription);
    if (button) button.addEventListener('click', copyCredits);
  }

  // normalise ids + z once, after load
  comic.forEach(function (f) { f.items.forEach(function (it) {
    it.id = nextId();
    if (it.z > maxZ) maxZ = it.z; else it.z = nextZ();
  }); });

  // ---- gate ---------------------------------------------------------------
  // Search words for the finder. A student's own choices from 3 Plan come first;
  // if they skipped it, words from their rolled brief and a few starters take
  // over, because an empty search box with no ideas is where a Year 8 stalls.
  var STARTER_WORDS = ['surprised', 'confused', 'proud', 'annoyed', 'excited', 'lonely'];
  var STOP_WORDS = ('a an the and or of in on at is are was were being their there they it its'
    + ' with for to from by very only can be has have had that this these those something someone'
    + ' everyone everything goes wrong about into over under across').split(' ');

  function briefWords() {
    var brief = null;
    try { brief = JSON.parse(localStorage.getItem('ff-brief') || 'null'); } catch (e) {}
    if (!brief) { return []; }
    var text = [brief.character, brief.situation, brief.problem]
      .filter(Boolean).join(' ') || brief.text || '';
    return text.toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/)
      .filter(function (w) { return w.length > 3 && STOP_WORDS.indexOf(w) === -1; });
  }

  function searchWords() {
    var words = [];
    var stim = null;
    try { stim = JSON.parse(localStorage.getItem('ff-stimulus') || 'null'); } catch (e) {}
    if (stim) {
      if (Array.isArray(stim.moods)) { words = words.concat(stim.moods); }
      if (stim.place) { words.push(stim.place); }
    }
    var fromPlan = words.length;
    // Top up from the rolled brief, then from starters, without repeating.
    briefWords().concat(STARTER_WORDS).forEach(function (w) {
      if (words.length < 6 && words.indexOf(w) === -1) { words.push(w); }
    });
    return { words: words.filter(Boolean).slice(0, 6), fromPlan: fromPlan };
  }

  function paintPickerBrief() {
    var el = document.querySelector('[data-picker-brief]');
    if (!el) { return; }
    var brief = null;
    try { brief = JSON.parse(localStorage.getItem('ff-brief') || 'null'); } catch (e) {}
    var line = '';
    if (brief) {
      line = brief.text || [brief.character, brief.situation, brief.problem].filter(Boolean).join(' · ');
    }
    if (!line) { el.hidden = true; return; }
    el.textContent = 'Your story: ' + line;
    el.hidden = false;
  }

  function paintStimulus() {
    var row = document.querySelector('[data-stim]');
    var list = document.querySelector('[data-stim-chips]');
    var label = document.querySelector('[data-stim-label]');
    var input = document.getElementById('search-input');
    var form = document.getElementById('search-form');
    if (!row || !list || !input) { return; }
    var result = searchWords();
    if (!result.words.length) { row.hidden = true; return; }
    if (label) {
      label.textContent = result.fromPlan ? 'From your plan:' : 'Try one of these:';
    }
    list.innerHTML = '';
    result.words.forEach(function (w, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'stim-chip' + (i < result.fromPlan ? ' is-yours' : '');
      b.textContent = w;
      b.setAttribute('aria-label', 'Search for ' + w);
      b.addEventListener('click', function () {
        input.value = w;
        if (form) {
          if (form.requestSubmit) { form.requestSubmit(); }
          else { form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }
        }
      });
      li.appendChild(b);
      list.appendChild(li);
    });
    row.hidden = false;
  }

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
    function rollLink(words) {
      var p = document.createElement('p'); p.className = 'small';
      p.style.margin = 'var(--s2) 0 0';
      var a = document.createElement('a'); a.href = 'roll.html';
      a.textContent = words;
      p.appendChild(a);
      return p;
    }
    if (line) {
      var lab = document.createElement('p'); lab.className = 'cb-brief__label';
      lab.textContent = 'Your story — put this across the four frames';
      var val = document.createElement('p'); val.className = 'cb-brief__line';
      val.textContent = line;
      box.appendChild(lab); box.appendChild(val);
      box.appendChild(rollLink('Change it on 2 Roll'));
    } else {
      // Nothing rolled on this device yet — fall back to a type-it-yourself box.
      var l = document.createElement('label'); l.className = 'cb-brief__label';
      l.setAttribute('for', 'cb-brief-in');
      l.textContent = 'Your story (type it here — or roll one on 2 Roll and it follows you back)';
      var inp = document.createElement('input'); inp.id = 'cb-brief-in'; inp.type = 'text';
      inp.placeholder = 'character · situation · problem';
      inp.addEventListener('input', function () {
        try { localStorage.setItem('ff-brief', JSON.stringify({ text: inp.value })); } catch (e) {}
      });
      box.appendChild(l); box.appendChild(inp);
      box.appendChild(rollLink('Roll your story on 2 Roll'));
    }
  }

  function unlock(guest) {
    $('#gate-section').hidden = true;
    $('#tool').hidden = false;
    $('#guest-note').hidden = !guest;
    // In guest mode the GIF panel of the picker shows a "needs the class
    // password" note instead of the search form. Bank and own-picture work.
    $('#gif-locked').hidden = !guest;
    $('#gif-open').hidden = !!guest;
    // The enhance preview calls /api too, so it is class-password only.
    var ec = $('#enhance-card'); if (ec) { ec.hidden = !!guest; }
    renderBrief();
    renderFrames();
    var step = document.querySelector('.step-pill[href="#build-comic"]');
    if (step) step.click();
  }

  async function tryPass(candidate) {
    var r = await fetch('/api/gifs?q=hello', { headers: { 'x-class-pass': candidate } });
    return r.ok;
  }

  if (pass) { unlock(); }
  else if (location.hash === '#build-comic' || location.hash === '#finish') {
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
    announce('Guest mode is open. Add a bank picture, your own picture or a short caption.');
  });

  // ---- the picture picker — a popover over the builder --------------------
  // Native <dialog>. showModal() traps focus and Escape closes it; on close,
  // focus goes back to the button that opened it, so a keyboard user never
  // loses their place in the comic.
  var picker = $('#picker');
  var pickerOpener = null;
  var bankLoaded = false;

  function pickerFrameLabel() {
    var strong = $('#picker-frame');
    if (strong) strong.textContent = 'Frame ' + (active + 1);
    Array.prototype.forEach.call(document.querySelectorAll('[data-pick-frame]'), function (b) {
      b.setAttribute('aria-pressed', String(+b.getAttribute('data-pick-frame') === active));
    });
  }
  function showPanel(id) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-pick-panel]'), function (p) {
      p.hidden = p.id !== id;
    });
    var radio = document.querySelector('input[name="pick-src"][value="' + id + '"]');
    if (radio && !radio.checked) radio.checked = true;
    if (id === 'pick-bank') loadBank();
  }
  function openPicker() {
    paintStimulus();
    paintPickerBrief();
    if (!picker || !picker.showModal) { $('#add-pic').click(); return; } // no <dialog>? go straight to a file
    pickerOpener = document.activeElement;
    pickerFrameLabel();
    // With the class password, GIF search is the drawcard; guests land on the bank.
    showPanel(pass ? 'pick-gif' : 'pick-bank');
    picker.showModal();
  }
  function closePicker() { if (picker && picker.open) picker.close(); }

  $('#open-picker').addEventListener('click', openPicker);
  $('#picker-close').addEventListener('click', closePicker);
  picker.addEventListener('close', function () {
    var back = pickerOpener || $('#open-picker');
    pickerOpener = null;
    if (back && back.focus) back.focus();
  });
  // a tap on the dimmed page around the panel closes it too
  picker.addEventListener('click', function (e) { if (e.target === picker) closePicker(); });

  Array.prototype.forEach.call(document.querySelectorAll('input[name="pick-src"]'), function (r) {
    r.addEventListener('change', function () { if (r.checked) showPanel(r.value); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-pick-frame]'), function (b) {
    b.addEventListener('click', function () {
      activate(+b.getAttribute('data-pick-frame'));
      pickerFrameLabel();
    });
  });

  // The bank panel reads bank.html itself (same origin, no new data file to
  // keep in sync). Picking a picture also fills that frame's credit slot.
  function fillCredit(fi, line) {
    if (!line) return;
    var slot = creditSlots()[fi];
    if (!slot || slot.value.trim()) return;
    slot.value = line;
    saveCredits();
    var m = $('#credit-msg');
    if (m) m.textContent = 'The credit for Frame ' + (fi + 1) + ' is filled in from the bank — check it on the Credits step.';
  }
  function loadBank() {
    if (bankLoaded) return;
    var msg = $('#bank-msg'); var grid = $('#bank-results');
    msg.textContent = 'Loading the class image bank…';
    fetch('bank.html')
      .then(function (r) { if (!r.ok) throw new Error('bank'); return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var entries = doc.querySelectorAll('.bank-entry');
        grid.innerHTML = '';
        Array.prototype.forEach.call(entries, function (entry) {
          var img = entry.querySelector('.bank-entry__img');
          if (!img) return;
          var src = img.getAttribute('src');
          var titleEl = entry.querySelector('.bank-entry__title');
          var name = titleEl ? titleEl.textContent.trim() : 'Bank picture';
          var creditEl = entry.querySelector('.copyable code');
          var credit = creditEl ? creditEl.textContent.trim() : '';
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Add to the active frame: ' + name);
          var im = document.createElement('img');
          im.src = src; im.alt = ''; im.loading = 'lazy';
          b.appendChild(im);
          b.addEventListener('click', function () {
            var fi = active;
            addImageItem(src, name);
            fillCredit(fi, credit);
          });
          grid.appendChild(b);
        });
        bankLoaded = grid.children.length > 0;
        msg.textContent = bankLoaded ? '' : 'The bank looks empty — open the full Class Image Bank below instead.';
      })
      .catch(function () {
        msg.textContent = 'Couldn’t load the bank in here. Open the full Class Image Bank below, download a picture, then add it with My own picture.';
      });
  }

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
    closePicker(); // the picker's job is done — show the picture landing in its frame
    announce('Added a picture to frame ' + (active + 1) + '.');
    $('#place-msg').textContent = 'Added to frame ' + (active + 1) + '. Drag it, resize the corner, or add more.';
  }

  function addBubble(kind) {
    var it = { id: nextId(), type: kind, src: '', text: '', x: 16, y: 20, w: 52, h: 24, z: nextZ() };
    comic[active].items.push(it);
    renderFrames(); save();
    announce('Added a ' + (kind === 'bubble' ? 'practice bubble' : 'caption') + ' to frame ' + (active + 1) + (kind === 'bubble' ? '. Remove it before your final download.' : '. Type a short description.'));
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
    pickerFrameLabel(); // keep the picker's "Adding to Frame N" honest
    announce('Frame ' + (i + 1) + ' is active.');
    $('#place-msg').textContent = 'Frame ' + (i + 1) + ' is active. Add a picture or a short caption.';
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
  // No modal confirm(): the question appears in place with two labelled
  // buttons, and focus lands on the safe choice.
  $('#clear-btn').addEventListener('click', function () {
    var ask = $('#clear-confirm');
    ask.hidden = false;
    $('#clear-confirm-no').focus();
  });
  $('#clear-confirm-no').addEventListener('click', function () {
    $('#clear-confirm').hidden = true;
    $('#clear-btn').focus();
  });
  $('#clear-confirm-yes').addEventListener('click', function () {
    $('#clear-confirm').hidden = true;
    lastClear = {
      comic: JSON.parse(JSON.stringify(comic)),
      active: active,
      maxZ: maxZ,
      credits: creditSlots().map(function (slot) { return slot.value; }),
      description: (comicDescription() || {}).value || ''
    };
    comic = emptyComic(); active = 0; maxZ = 0;
    try { localStorage.removeItem(EXPORT_KEY); } catch (e) {}
    renderFrames(); save(); clearCredits(); clearComicDescription();
    $('#undo-clear').hidden = false;
    $('#undo-clear').focus(); // the confirm buttons just vanished — don't strand keyboard focus
    announce('Cleared all four frames, credits and comic description. Undo clear is available until you refresh.');
    $('#place-msg').textContent = 'Frame 1 is active. Add a picture or a short caption.';
  });

  $('#undo-clear').addEventListener('click', function () {
    if (!lastClear) return;
    comic = lastClear.comic;
    active = lastClear.active;
    maxZ = lastClear.maxZ;
    creditSlots().forEach(function (slot, i) { slot.value = lastClear.credits[i] || ''; });
    var description = comicDescription();
    if (description) description.value = lastClear.description || '';
    renderFrames(); save(); saveCredits();
    saveComicDescription();
    lastClear = null;
    $('#undo-clear').hidden = true;
    $('#credit-msg').textContent = 'Your credits and comic description are back with your comic.';
    $('#clear-btn').focus();
    announce('Your comic, credits and description are back.');
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

  // No modal confirm(): the name check is an in-page question with two
  // labelled buttons. "Yes, all made up" re-runs the export with the check
  // already answered.
  function textIsSafeToExport(nameCheckPassed) {
    var hasPracticeBubble = comic.some(function (frame) {
      return frame.items.some(function (item) { return item.type === 'bubble'; });
    });
    if (hasPracticeBubble) {
      $('#export-msg').textContent = 'Remove every practice speech bubble before you download the final comic.';
      return false;
    }
    var words = comic.map(function (frame) {
      return frame.items.filter(function (item) { return item.type !== 'image'; })
        .map(function (item) { return item.text || ''; }).join(' ');
    }).join(' ');
    if (!words.trim()) return true;
    if (/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b|\b(?:\+?61|0)\d[\d\s-]{7,}\b/.test(words)) {
      $('#export-msg').textContent = 'Take out contact details before you download. Keep real people private.';
      return false;
    }
    if (!nameCheckPassed) {
      $('#export-msg').textContent = '';
      $('#name-check').hidden = false;
      $('#name-check-yes').focus();
      return false;
    }
    return true;
  }

  $('#name-check-yes').addEventListener('click', function () {
    $('#name-check').hidden = true;
    startExport(true);
  });
  $('#name-check-no').addEventListener('click', function () {
    $('#name-check').hidden = true;
    $('#export-msg').textContent = 'Edit the words first. Keep real people out of the comic.';
    $('#export-btn').focus();
  });

  $('#export-btn').addEventListener('click', function () { startExport(false); });
  function startExport(nameCheckPassed) {
    $('#name-check').hidden = true;
    var msg = $('#export-msg'); msg.textContent = 'Building your comic…';
    var CELL_W = 600, CELL_H = 450, GAP = 18;
    var W = CELL_W * 2 + GAP * 3, H = CELL_H * 2 + GAP * 3;
    var anyItem = comic.some(function (f) { return f.items.length; });
    if (!anyItem) { msg.textContent = 'Add a picture or caption to a frame first.'; return; }
    if (!textIsSafeToExport(nameCheckPassed)) return;

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
      try { localStorage.setItem(EXPORT_KEY, String(Date.now())); } catch (e) {}
      msg.textContent = anyFail
        ? 'Saved your comic — but a picture was skipped. Screenshot if you need it exact.'
        : 'Saved your comic to Downloads. Final submission is now open on 5 Share.';
    }
  }

  // first paint if already unlocked
  startCredits();
  if (pass) renderFrames();

  /* Draws the four frames onto one canvas — the same picture the download makes.
     Ported alongside the enhance preview so the model is sent exactly what the
     student would hand in, not a second, differently-drawn version. */
  function composeComic(done) {
    var CELL_W = 600, CELL_H = 450, GAP = 18;
    var W = CELL_W * 2 + GAP * 3, H = CELL_H * 2 + GAP * 3;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#FFF9F0'; ctx.fillRect(0, 0, W, H);

    // preload all image items, then draw everything in z-order
    var imgItems = [];
    comic.forEach(function (f) { f.items.forEach(function (it) { if (it.type === 'image') imgItems.push(it); }); });
    var loaded = {}, pending = imgItems.length, anyFail = false;

    function afterLoad() { try { draw(); } catch (e) { done(null, true); } }

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
      var url = null;
      try { url = cv.toDataURL('image/png'); } catch (e) { url = null; }
      done(url, anyFail);
    }
  }

  // ---- AI enhance preview (class password only) ---------------------------
  // Sends the SAME composed image the download makes, plus the rolled story,
  // to /api/render, which asks the model to enhance the student's submission
  // rather than redraw from scratch. The result is a preview on this page —
  // the student's own comic stays the real submission.
  function briefLine() {
    var brief = null;
    try { brief = JSON.parse(localStorage.getItem('ff-brief') || 'null'); } catch (e) {}
    return brief ? (brief.text ||
      [brief.character, brief.situation, brief.problem].filter(Boolean).join(' · ')) : '';
  }

  function planPlace() {
    try {
      var st = JSON.parse(localStorage.getItem('ff-stimulus') || 'null');
      return (st && st.place) ? st.place : '';
    } catch (e) { return ''; }
  }

  $('#enhance-btn').addEventListener('click', function () {
    var placeText = planPlace();
    var msg = $('#enhance-msg'); var out = $('#enhance-out');
    var anyItem = comic.some(function (f) { return f.items.length; });
    if (!anyItem) { msg.textContent = 'Add a picture or caption to a frame first.'; return; }
    msg.textContent = 'Sending your comic to the illustrator… this takes about 15 seconds.';
    $('#enhance-btn').disabled = true;
    composeComic(function (url) {
      if (!url) {
        msg.textContent = 'Couldn’t package your comic (a picture blocked it). The download above still works.';
        $('#enhance-btn').disabled = false;
        return;
      }
      fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-class-pass': pass },
        body: JSON.stringify({ place: placeText, brief: briefLine(), submissionDataUri: url })
      }).then(function (r) { return r.json().then(function (data) { return { ok: r.ok, status: r.status, data: data }; }); })
        .then(function (res) {
          $('#enhance-btn').disabled = false;
          if (res.status === 401) { msg.textContent = 'The class password expired. Reload and enter it again.'; return; }
          if (!res.ok || !res.data.image) { msg.textContent = res.data.error || 'The enhancer is unavailable right now.'; return; }
          out.innerHTML = '';
          var img = document.createElement('img');
          img.src = res.data.image;
          img.alt = 'AI-enhanced preview of your four-frame comic';
          img.style.maxWidth = '100%'; img.style.border = '3px solid #14141C'; img.style.borderRadius = '8px';
          var save = document.createElement('a');
          save.href = res.data.image; save.download = 'four-frames-enhanced.png';
          save.className = 'btn-secondary'; save.style.display = 'inline-block'; save.style.marginTop = 'var(--s3)';
          save.textContent = 'Save the enhanced preview';
          out.appendChild(img); out.appendChild(save);
          out.hidden = false;
          msg.textContent = 'Here is the enhanced preview. Notice what the illustrator kept and what it changed — your own comic is still the submission.';
          announce('The enhanced preview of your comic is ready.');
        })
        .catch(function () {
          $('#enhance-btn').disabled = false;
          msg.textContent = 'Couldn’t reach the class server. Try again in a moment.';
        });
    });
  });
})();
