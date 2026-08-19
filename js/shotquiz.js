/* Four Frames — "name the shot" check on 1 Look.
   Three pictures, three choices each. It is a check, not a test: a wrong answer
   says why and lets them try again, and nothing is scored or stored anywhere.
   The pictures are ones they meet again in the Panel Scramble, so the words
   arrive attached to images they will actually use. */
(function () {
  'use strict';
  var root = document.querySelector('[data-shotquiz]');
  if (!root) { return; }

  var WHY = {
    wide: 'Wide — you can see the whole place and where things are.',
    mid: 'Mid — close enough to see what is happening, far enough to see some of the place.',
    close: 'Close-up — one thing fills the picture, so you look at it and nothing else.'
  };
  var NUDGE = {
    wide: 'Not quite — a wide shot shows you the whole place.',
    mid: 'Not quite — a mid shot shows the action with a bit of the place around it.',
    close: 'Not quite — a close-up fills the picture with one thing.'
  };

  var items = Array.prototype.slice.call(root.querySelectorAll('[data-sq-item]'));
  var score = root.querySelector('[data-sq-score]');
  var got = 0;

  function tally() {
    if (!score) { return; }
    score.textContent = got + ' of ' + items.length + ' named.' +
      (got === items.length ? ' That is the whole vocabulary — now go and use it.' : '');
  }

  items.forEach(function (item) {
    var answer = item.getAttribute('data-sq-answer');
    var msg = item.querySelector('[data-sq-msg]');
    var done = false;
    Array.prototype.forEach.call(item.querySelectorAll('[data-sq-pick]'), function (btn) {
      btn.addEventListener('click', function () {
        if (done) { return; }
        var pick = btn.getAttribute('data-sq-pick');
        if (pick === answer) {
          done = true;
          got += 1;
          item.classList.add('is-right');
          btn.classList.add('is-right');
          if (msg) { msg.textContent = WHY[answer]; }
          Array.prototype.forEach.call(item.querySelectorAll('[data-sq-pick]'), function (b) {
            b.disabled = true;
          });
          tally();
        } else {
          /* Wrong answers are not punished and not counted — the button simply
             tells them what that shot would have looked like and stays live. */
          if (msg) { msg.textContent = NUDGE[pick]; }
          btn.classList.add('is-wrong');
          window.setTimeout(function () { btn.classList.remove('is-wrong'); }, 900);
        }
      });
    });
  });

  tally();
}());
