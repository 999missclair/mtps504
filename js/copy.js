/* ==========================================================================
   FOUR FRAMES — the copyable boxes
   One behaviour, used by every copyable box that isn't the rolled brief
   (the brief has its own handling inside js/dice.js, because it also has to
   be written before it can be copied).

     <div class="copyable">
       <code id="naming">FourFrames_8VA_Surname_FirstName</code>
       <button type="button" class="copy-btn" data-copy-for="naming"
               aria-label="Copy the file-name format">Copy</button>
     </div>

   Rules kept, and they are claims made in the video rationale:
   - No storage, no network. Nothing is remembered and nothing is sent.
   - The Clipboard API first, then a select-the-text fallback, then a spoken
     instruction — because the school build may not be a secure context and a
     Copy button that silently does nothing is worse than no button.
   - The result is announced in a live region (design spec 5.3), never shown
     only as a colour change.
   ========================================================================== */

(function () {
  'use strict';

  function liveRegion() {
    var region = document.getElementById('ff-copy-live');
    if (region) { return region; }
    region = document.createElement('p');
    region.id = 'ff-copy-live';
    region.className = 'visually-hidden';
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
    return region;
  }

  function say(message) {
    var region = liveRegion();
    region.textContent = '';
    window.setTimeout(function () { region.textContent = message; }, 40);
  }

  /* The text of a copyable box, with the line breaks the HTML source needs
     but the clipboard does not. */
  function textOf(node) {
    return node.textContent.replace(/\s+/g, ' ').trim();
  }

  function selectAndCopy(node) {
    var range = document.createRange();
    range.selectNodeContents(node);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (error) { ok = false; }
    say(ok
      ? 'Copied.'
      : 'The text is selected. Press Control and C, or Command and C, to copy it.');
  }

  function wire(button) {
    button.addEventListener('click', function () {
      var target = document.getElementById(button.getAttribute('data-copy-for'));
      if (!target) { return; }
      var text = textOf(target);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { say('Copied.'); },
          function () { selectAndCopy(target); }
        );
      } else {
        selectAndCopy(target);
      }
    });
  }

  function start() {
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-copy-for]'), wire
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
