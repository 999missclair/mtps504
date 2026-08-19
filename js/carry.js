/* Four Frames — show the student's own work on 5 Share, ready to paste.
   The Builder already stores the rolled brief, the four credit lines and the
   comic description. Until now Share told a student to "paste your four copied
   credit lines" and relied on the clipboard still holding what the Builder put
   there two pages earlier — one stray copy in between and the work was gone,
   even though the text was sitting in storage the whole time.
   Device-only localStorage: no account, no cookie, nothing leaves the machine. */
(function () {
  'use strict';

  var mount = document.querySelector('[data-carry]');
  var body = document.querySelector('[data-carry-body]');
  if (!mount || !body) { return; }

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  /* The description is stored as a plain string by canvas.js, not as JSON —
     parsing it would throw and silently drop it. */
  function readText(key) {
    try { return localStorage.getItem(key) || ''; } catch (e) { return ''; }
  }

  var brief = read('ff-brief');
  var credits = read('ff-credits');
  var description = readText('ff-comic-description');

  var briefLine = '';
  if (brief) {
    briefLine = brief.text ||
      [brief.character, brief.situation, brief.problem].filter(Boolean).join(' · ');
  }
  var creditLines = [];
  if (Array.isArray(credits)) {
    creditLines = credits.map(function (c) { return (c || '').trim(); }).filter(Boolean);
  } else if (credits && typeof credits === 'object') {
    creditLines = Object.keys(credits).sort().map(function (k) {
      return (credits[k] || '').trim();
    }).filter(Boolean);
  }
  var descText = description.trim();

  if (!briefLine && !creditLines.length && !descText) { return; }

  /* One copy routine, used by every block. Clipboard first; if that is refused
     (it can be, outside a secure context on a school build) the text is selected
     so Control-C still works. Never a dead button. */
  function addBlock(title, text, hint) {
    var wrap = document.createElement('div');
    wrap.className = 'carry__block';

    var h = document.createElement('h4');
    h.textContent = title;
    wrap.appendChild(h);

    var pre = document.createElement('p');
    pre.className = 'carry__text';
    pre.textContent = text;
    wrap.appendChild(pre);

    if (hint) {
      var small = document.createElement('p');
      small.className = 'small';
      small.textContent = hint;
      wrap.appendChild(small);
    }

    var note = document.createElement('span');
    note.className = 'small';
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-secondary';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy ' + title.toLowerCase());
    btn.addEventListener('click', function () {
      function ok() { note.textContent = ' Copied.'; }
      function fallback() {
        var range = document.createRange();
        range.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        note.textContent = ' Selected — press Control-C or Command-C.';
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, fallback);
      } else { fallback(); }
    });

    var row = document.createElement('p');
    row.appendChild(btn);
    row.appendChild(note);
    wrap.appendChild(row);

    body.appendChild(wrap);
  }

  if (briefLine) { addBlock('Your rolled brief', briefLine, 'This is your post title.'); }
  if (creditLines.length) {
    addBlock('Your credit lines', creditLines.join('\n'),
      creditLines.length + ' of 4 filled in. One per picture you used.');
  }
  if (descText) { addBlock('Your comic description', descText, 'Goes in the Padlet image description.'); }

  mount.hidden = false;
}());
