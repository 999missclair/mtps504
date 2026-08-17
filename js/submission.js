/* Four Frames — final submission handoff.
   A browser cannot prove where a file was saved, so this records only that the
   Comic Builder successfully started a download on this device. It is enough
   to prevent the final Padlet appearing before the student has made a file;
   it is not assessment evidence or a replacement for the teacher's review. */
(function () {
  'use strict';

  var EXPORT_KEY = 'ff-comic-downloaded';
  var gate = document.querySelector('[data-final-submission]');
  if (!gate) return;

  function downloaded() {
    try { return !!localStorage.getItem(EXPORT_KEY); } catch (e) { return false; }
  }
  function postLinks() {
    return Array.prototype.slice.call(document.querySelectorAll('a[href="#post"], .step-pill[href="#post"]'));
  }
  function showLockedMessage() {
    var nudge = document.querySelector('.final-submission-nudge');
    if (!nudge) return;
    nudge.hidden = false;
    nudge.textContent = 'Download your comic in the Comic Builder first. Then return here to open the Final submission Padlet.';
    window.clearTimeout(showLockedMessage.timer);
    showLockedMessage.timer = window.setTimeout(function () { nudge.hidden = true; }, 5200);
  }
  function lockPost() {
    postLinks().forEach(function (link) {
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('data-submission-locked', '');
      link.setAttribute('title', 'Download your comic in the Comic Builder first.');
    });
  }
  function unlockPost() {
    postLinks().forEach(function (link) {
      if (!link.hasAttribute('data-submission-locked')) return;
      link.removeAttribute('aria-disabled');
      link.removeAttribute('data-submission-locked');
      link.removeAttribute('title');
    });
  }
  function showPadlet() {
    var embed = (gate.getAttribute('data-final-padlet-embed') || '').trim();
    var link = (gate.getAttribute('data-final-padlet-link') || '').trim();
    var mount = gate.querySelector('[data-final-padlet-mount]');
    if (!mount) return;
    if (/^https:\/\/padlet\.com\/embed\//.test(embed) && /^https:\/\/padlet\.com\//.test(link)) {
      mount.innerHTML =
        '<p class="small">The Final submission Padlet opens in a new tab, so your comic and its upload controls have the whole screen.</p>' +
        '<p style="margin-top:var(--s3)"><a class="btn-primary btn-block" href="' + link +
        '" target="_blank" rel="noopener noreferrer">Open the Final submission Padlet ' +
        '<span class="ext-glyph" aria-hidden="true">↗</span><span class="visually-hidden">(opens in a new tab)</span></a></p>';
    } else {
      mount.innerHTML = '<p class="final-padlet-missing">Your download is recorded. Your teacher will add the Final submission Padlet link here before the final lesson.</p>';
    }
  }
  function update() {
    var isReady = downloaded();
    var locked = gate.querySelector('[data-final-submission-locked]');
    var ready = gate.querySelector('[data-final-submission-ready]');
    if (locked) locked.hidden = isReady;
    if (ready) ready.hidden = !isReady;
    if (isReady) { unlockPost(); showPadlet(); }
    else lockPost();
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href="#post"], .step-pill[href="#post"]');
    if (!link || downloaded()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showLockedMessage();
  }, true);
  window.addEventListener('storage', function (event) { if (event.key === EXPORT_KEY) update(); });
  update();
})();
