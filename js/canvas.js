/* GIF Storyboard — search G-rated GIFs (server-proxied, rating locked to g) and
   arrange four scenes. Class-password gated. Persists to localStorage (device-only).
   ponytail: vanilla JS, no libraries. Snapshot is a static PNG; true GIF compositing
   would need a heavy encoder and isn't worth it for a planning tool. */
(function () {
  'use strict';
  var PASS_KEY = 'ff-class-pass';       // sessionStorage — this session only
  var STATE_KEY = 'ff-storyboard';      // localStorage — survives refresh, device only
  var NFRAMES = 4;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var pass = sessionStorage.getItem(PASS_KEY) || '';
  var picked = null;                    // currently selected search result
  var frames = load();                  // [{gif, caption}, ...] length 4

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STATE_KEY));
      if (s && Array.isArray(s.frames) && s.frames.length === NFRAMES) return s.frames;
    } catch (e) {}
    return Array.from({ length: NFRAMES }, function () { return { gif: null, caption: '' }; });
  }
  function save() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ frames: frames })); } catch (e) {}
  }

  // ---- gate ---------------------------------------------------------------
  function unlock() { $('#gate-section').hidden = true; $('#tool').hidden = false; renderFrames(); }

  async function tryPass(candidate) {
    // Validate against the server with a tiny search. 200 = ok, 401 = wrong.
    var r = await fetch('/api/gifs?q=hello', { headers: { 'x-class-pass': candidate } });
    if (r.status === 401) return false;
    return true; // 200, or any non-401 (e.g. 500 if GIPHY key missing) still means the pass passed
  }

  if (pass) { unlock(); }

  $('#gate-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var val = $('#gate-input').value.trim();
    $('#gate-msg').textContent = 'Checking…';
    var ok = await tryPass(val).catch(function () { return null; });
    if (ok) { pass = val; sessionStorage.setItem(PASS_KEY, val); $('#gate-msg').textContent = ''; unlock(); }
    else if (ok === false) { $('#gate-msg').textContent = 'That password didn’t work. Check with your teacher.'; }
    else { $('#gate-msg').textContent = 'Couldn’t reach the class server. Try again.'; }
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
        b.setAttribute('aria-label', 'Pick GIF: ' + (g.title || 'untitled'));
        var im = document.createElement('img');
        im.src = g.preview; im.alt = ''; im.loading = 'lazy';
        b.appendChild(im);
        b.addEventListener('click', function () { pick(g, b); });
        grid.appendChild(b);
      });
    } catch (err) { msg.textContent = 'Search is unavailable right now.'; }
  });

  function pick(g, btn) {
    picked = g;
    Array.prototype.forEach.call($('#results').children, function (c) { c.classList.remove('is-picked'); });
    btn.classList.add('is-picked');
    $('#place-msg').textContent = 'Got it. Now tap a frame to drop it in.';
  }

  // ---- frames -------------------------------------------------------------
  function renderFrames() {
    var wrap = $('#frames'); wrap.innerHTML = '';
    frames.forEach(function (f, i) {
      var frame = document.createElement('div');
      frame.className = 'frame';

      var slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'frame__slot';
      slot.setAttribute('aria-label', 'Frame ' + (i + 1) + (f.gif ? ', has a GIF. Tap to replace.' : ', empty. Pick a GIF then tap here.'));
      var num = document.createElement('span'); num.className = 'frame__num'; num.textContent = i + 1; slot.appendChild(num);
      if (f.gif) {
        var im = document.createElement('img'); im.src = f.gif.full; im.alt = f.gif.title || ''; slot.appendChild(im);
      } else {
        var e = document.createElement('span'); e.className = 'frame__empty'; e.textContent = ['Setup', 'Escalation', 'Escalation', 'Punchline'][i]; slot.appendChild(e);
      }
      slot.addEventListener('click', function () { placeInto(i); });
      frame.appendChild(slot);

      var cap = document.createElement('input');
      cap.className = 'frame__cap'; cap.type = 'text'; cap.value = f.caption || '';
      cap.placeholder = 'Caption (optional)'; cap.setAttribute('aria-label', 'Caption for frame ' + (i + 1));
      cap.addEventListener('input', function () { frames[i].caption = cap.value; save(); });
      frame.appendChild(cap);

      var bar = document.createElement('div'); bar.className = 'frame__bar';
      var clr = document.createElement('button'); clr.type = 'button'; clr.className = 'btn-secondary';
      clr.textContent = 'Clear'; clr.addEventListener('click', function () { frames[i].gif = null; save(); renderFrames(); });
      bar.appendChild(clr);
      frame.appendChild(bar);

      wrap.appendChild(frame);
    });
  }

  function placeInto(i) {
    if (!picked) { $('#place-msg').textContent = 'Pick a GIF above first, then tap a frame.'; return; }
    frames[i].gif = { id: picked.id, full: picked.full, title: picked.title };
    save(); renderFrames();
    $('#place-msg').textContent = 'Dropped into frame ' + (i + 1) + '. Pick another.';
  }

  $('#clear-btn').addEventListener('click', function () {
    frames = Array.from({ length: NFRAMES }, function () { return { gif: null, caption: '' }; });
    save(); renderFrames();
  });

  // ---- snapshot (static PNG; falls back to a screenshot tip if CORS taints) ----
  $('#snapshot-btn').addEventListener('click', function () {
    var msg = $('#snapshot-msg'); msg.textContent = 'Building your snapshot…';
    var W = 800, H = 640, cw = W / 2, ch = H / 2;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#FFF9F0'; ctx.fillRect(0, 0, W, H);
    var todo = frames.filter(function (f) { return f.gif; }).length;
    if (!todo) { msg.textContent = 'Add a GIF to a frame first.'; return; }
    var done = 0, failed = false;
    frames.forEach(function (f, i) {
      var x = (i % 2) * cw, y = Math.floor(i / 2) * ch;
      ctx.strokeStyle = '#14141C'; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, cw - 4, ch - 4);
      if (!f.gif) return;
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () {
        try { ctx.drawImage(im, x + 6, y + 6, cw - 12, ch - 48); } catch (e) { failed = true; }
        if (f.caption) { ctx.fillStyle = '#14141C'; ctx.font = '18px system-ui, sans-serif';
          ctx.fillText(String(f.caption).slice(0, 40), x + 10, y + ch - 16); }
        if (++done === todo) finish();
      };
      im.onerror = function () { failed = true; if (++done === todo) finish(); };
      im.src = f.gif.full;
    });
    function finish() {
      var url;
      try { url = cv.toDataURL('image/png'); } catch (e) { failed = true; }
      if (failed || !url) {
        msg.textContent = 'Couldn’t save an image (the GIF host blocked it). Take a screenshot instead — on a Mac, Shift-Cmd-4.';
        return;
      }
      var a = document.createElement('a'); a.href = url; a.download = 'four-frames-storyboard.png';
      document.body.appendChild(a); a.click(); a.remove();
      msg.textContent = 'Saved a snapshot to your Downloads.';
    }
  });

  // first paint if already unlocked
  if (pass) renderFrames();
})();
