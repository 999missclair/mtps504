/* Four Frames — Panel Scramble: six mismatched pictures, one student-made story.
   This is intentionally local and deterministic. The five-second pause is a
   thinking cue, not a search or an AI generation claim. Nothing is saved. */
(function () {
  'use strict';

  function all(root, selector) {
    return Array.prototype.slice.call(root.querySelectorAll(selector));
  }

  function init(root) {
    var cards = all(root, '[data-story-card]');
    var slots = all(root, '[data-story-slot]');
    var clear = root.querySelector('[data-story-clear]');
    var think = root.querySelector('[data-story-think]');
    var timer = root.querySelector('[data-story-timer]');
    var live = root.querySelector('[data-story-live]');
    var result = root.querySelector('[data-story-result]');
    var completion = root.querySelector('[data-story-completion]');
    var reading = root.querySelector('[data-story-reading]');
    var reveal = root.querySelector('[data-story-reveal]');
    var chosen = [];
    var timerId = null;

    function say(message) {
      if (live) { live.textContent = message; }
    }

    function paintSlots() {
      slots.forEach(function (slot, index) {
        var card = chosen[index];
        var line = slot.querySelector('[data-story-slot-line]');
        slot.classList.toggle('is-filled', !!card);
        if (line) {
          line.textContent = card
            ? card.getAttribute('data-story-title')
            : 'Choose a picture.';
        }
      });
      cards.forEach(function (card) {
        card.setAttribute('aria-pressed', chosen.indexOf(card) > -1 ? 'true' : 'false');
      });

      if (think) { think.disabled = chosen.length !== 4 || !!timerId; }
      if (result) {
        if (chosen.length < 4) {
          result.textContent = chosen.length + ' of 4 pictures chosen.';
        } else {
          result.textContent = 'Four pictures chosen. Read one possible story, or change the order first.';
        }
      }
    }

    function choose(card) {
      var current = chosen.indexOf(card);
      if (current > -1) {
        chosen.splice(current, 1);
        say(card.getAttribute('data-story-title') + ' removed.');
      } else if (chosen.length < 4) {
        chosen.push(card);
        say('Frame ' + chosen.length + ': ' + card.getAttribute('data-story-title') + '.');
      } else {
        say('You already have four frames. Remove one picture or use Clear four frames.');
      }
      if (reading) { reading.hidden = true; }
      if (completion) { completion.hidden = true; }
      if (timer) { timer.textContent = chosen.length === 4 ? 'Four pictures ready. Read one possible story.' : 'Choose four pictures to reveal a reading.'; }
      paintSlots();
    }

    function revealStory() {
      if (!reveal || chosen.length !== 4) return;
      var openings = ['First', 'Then', 'The turn', 'Last'];
      var endings = [
        'It gives the reader a detail to notice.',
        'Now the first picture needs another explanation.',
        'This is where the situation becomes impossible to ignore.',
        'This last image changes how the earlier pictures can be read.'
      ];
      reveal.innerHTML = '';
      chosen.forEach(function (card, index) {
        var item = document.createElement('li');
        var title = card.getAttribute('data-story-title') || ('Picture ' + (index + 1));
        var line = card.getAttribute('data-story-line') || 'Something unexpected appears.';
        item.innerHTML = '<strong>Frame ' + (index + 1) + ' · ' + openings[index] + '</strong><span>' + line + ' ' + endings[index] + '</span>';
        reveal.appendChild(item);
      });
      if (reading) { reading.hidden = false; }
      if (completion) { completion.hidden = false; }
      if (timer) { timer.textContent = 'One possible reading is ready. Change the order to read another one.'; }
      say('One possible story is ready. It uses Picture ' + chosen.map(function (card) {
        return card.getAttribute('data-story-card').toUpperCase();
      }).join(', Picture ') + ' in that order.');
    }

    cards.forEach(function (card) {
      card.setAttribute('aria-pressed', 'false');
      card.addEventListener('click', function () { choose(card); });
    });

    if (clear) {
      clear.addEventListener('click', function () {
        chosen = [];
        if (reading) { reading.hidden = true; }
        if (completion) { completion.hidden = true; }
        if (timer) { timer.textContent = 'Choose four pictures to reveal a reading.'; }
        paintSlots();
        say('Four frames cleared.');
      });
    }

    if (think) {
      think.addEventListener('click', function () {
        if (timerId || chosen.length !== 4) { return; }
        var seconds = 5;
        think.disabled = true;
        if (timer) { timer.textContent = 'Thinking up a reading … ' + seconds; }
        say('Taking five seconds to read the story in this order.');
        timerId = window.setInterval(function () {
          seconds -= 1;
          if (seconds > 0) {
            if (timer) { timer.textContent = 'Thinking up a reading … ' + seconds; }
            return;
          }
          window.clearInterval(timerId);
          timerId = null;
          revealStory();
          paintSlots();
        }, 1000);
      });
    }

    paintSlots();
  }

  function start() {
    all(document, '[data-story-scramble]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}());
