/* Four Frames — local development review notes.
   Only loaded when the URL contains ?dev-comments=1. Notes live in this tab's
   session storage and are never sent to the site, a teacher or another student. */
(function () {
  'use strict';

  var KEY = 'ff-dev-comments';
  var flag = new URLSearchParams(location.search).has('dev-comments');
  if (!flag) return;

  function read() {
    try {
      var value = JSON.parse(sessionStorage.getItem(KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (e) { return []; }
  }
  function write(notes) {
    try { sessionStorage.setItem(KEY, JSON.stringify(notes)); return true; } catch (e) { return false; }
  }
  function pageName() {
    var title = document.querySelector('h1');
    return title ? title.textContent.trim() : document.title;
  }
  function noteText(notes) {
    var lines = ['# Four Frames development review', '', 'Collected locally with ?dev-comments=1.', ''];
    notes.forEach(function (note, index) {
      lines.push((index + 1) + '. **' + note.page + '**');
      lines.push('   - URL: ' + note.url);
      lines.push('   - Viewport: ' + note.viewport);
      lines.push('   - Seen: ' + note.seen);
      if (note.where) lines.push('   - Location: ' + note.where);
      lines.push('   - Defect: ' + note.text);
      lines.push('');
    });
    return lines.join('\n');
  }
  function copy(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else { fallbackCopy(text, done); }
  }
  function fallbackCopy(text, done) {
    var area = document.createElement('textarea');
    area.value = text;
    area.className = 'dev-comments__copy-area';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); done(); }
    catch (e) { done(false); }
    area.remove();
  }

  var notes = read();
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'dev-comments__toggle';
  toggle.setAttribute('aria-controls', 'dev-comments-panel');
  toggle.setAttribute('aria-expanded', 'false');

  var panel = document.createElement('aside');
  panel.className = 'dev-comments';
  panel.id = 'dev-comments-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="dev-comments__head"><h2>Development notes</h2><button type="button" data-dev-close>Close</button></div>' +
    '<p class="small">Local to this tab. Notes are not visible to students and are never sent anywhere.</p>' +
    '<form data-dev-form>' +
      '<label>What is wrong?<textarea required data-dev-text placeholder="Describe the defect, confusing copy or visual problem."></textarea></label>' +
      '<label>Where on this page? <input type="text" data-dev-where placeholder="Optional: section, button or screen area"></label>' +
      '<button type="submit" class="btn-primary">Save note</button>' +
    '</form>' +
    '<div class="dev-comments__actions"><button type="button" class="btn-secondary" data-dev-export>Copy all notes</button><p class="small" role="status" data-dev-status></p></div>' +
    '<ol data-dev-list></ol>';
  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  var form = panel.querySelector('[data-dev-form]');
  var text = panel.querySelector('[data-dev-text]');
  var where = panel.querySelector('[data-dev-where]');
  var list = panel.querySelector('[data-dev-list]');
  var status = panel.querySelector('[data-dev-status]');

  function render() {
    toggle.textContent = 'Dev notes (' + notes.length + ')';
    list.innerHTML = '';
    notes.forEach(function (note) {
      var item = document.createElement('li');
      var heading = document.createElement('strong');
      var body = document.createElement('span');
      heading.textContent = note.page;
      body.textContent = note.text;
      item.appendChild(heading);
      item.appendChild(body);
      list.appendChild(item);
    });
  }
  function open() {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    text.focus();
  }
  function close() {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  }

  toggle.addEventListener('click', function () { panel.hidden ? open() : close(); });
  panel.querySelector('[data-dev-close]').addEventListener('click', close);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var value = text.value.trim();
    if (!value) return;
    notes.push({
      page: pageName(),
      url: location.pathname + location.hash,
      viewport: window.innerWidth + '×' + window.innerHeight,
      seen: new Date().toLocaleString('en-AU'),
      where: where.value.trim(),
      text: value
    });
    write(notes);
    text.value = '';
    where.value = '';
    status.textContent = 'Note saved. Keep reviewing or copy all notes when ready.';
    render();
    text.focus();
  });
  panel.querySelector('[data-dev-export]').addEventListener('click', function () {
    if (!notes.length) { status.textContent = 'Add a note before exporting.'; return; }
    copy(noteText(notes), function (copied) {
      status.textContent = copied === false ? 'Select the copied text manually.' : 'All notes copied. Paste them into Codex in one message.';
    });
  });

  /* Keep the development switch on same-site page links for a multi-page pass. */
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link || link.target === '_blank') return;
    var url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/\.html$/.test(url.pathname)) return;
    url.searchParams.set('dev-comments', '1');
    link.href = url.href;
  }, true);

  render();
}());
