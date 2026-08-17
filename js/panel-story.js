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
    var question = root.querySelector('[data-story-question]');
    var readingTitle = root.querySelector('[data-story-reading-title]');
    var readingImages = root.querySelector('[data-story-reading-images]');
    var routePrompt = root.querySelector('[data-story-route-prompt]');
    var intro = root.querySelector('[data-story-intro]');
    var bank = window.FOUR_FRAMES_STORY_BANK || {};
    var chosen = [];
    var timerId = null;

    function say(message) {
      if (live) { live.textContent = message; }
    }

    function paintSlots() {
      slots.forEach(function (slot, index) {
        var card = chosen[index];
        var line = slot.querySelector('[data-story-slot-line]');
        var image = slot.querySelector('[data-story-slot-image]');
        slot.classList.toggle('is-filled', !!card);
        if (line) {
          line.textContent = card
            ? card.getAttribute('data-story-title')
            : 'Choose a picture.';
        }
        if (image) {
          image.hidden = !card;
          image.src = card ? card.querySelector('img').src : '';
          image.alt = card ? card.querySelector('img').alt : '';
        }
      });
      cards.forEach(function (card) {
        var order = chosen.indexOf(card);
        card.setAttribute('aria-pressed', order > -1 ? 'true' : 'false');
        if (order > -1) {
          card.setAttribute('data-story-order', String(order + 1));
          card.querySelector('span').setAttribute('data-story-order', String(order + 1));
        } else {
          card.removeAttribute('data-story-order');
          card.querySelector('span').removeAttribute('data-story-order');
        }
      });

      if (think) { think.disabled = chosen.length !== 4 || !!timerId; }
      if (routePrompt) { routePrompt.hidden = chosen.length === 4; }
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
      if (intro) { intro.hidden = false; }
      if (timer) { timer.textContent = chosen.length === 4 ? 'Four pictures ready. Read one possible story.' : 'Choose four pictures to reveal a reading.'; }
      paintSlots();
    }

    function revealStory() {
      if (!reveal || chosen.length !== 4) return;
      var key = chosen.map(function (card) { return card.getAttribute('data-story-card'); }).join(',');
      var story = bank[key];
      reveal.innerHTML = '';
      if (readingImages) { readingImages.innerHTML = ''; }
      if (!story) {
        if (timer) { timer.textContent = 'This reading is not ready yet. Try another order or tell your teacher.'; }
        say('This four-picture reading is not ready yet.');
        return;
      }
      story.beats.forEach(function (beat, index) {
        var item = document.createElement('li');
        var heading = document.createElement('strong');
        var line = document.createElement('span');
        var match = /^Frame\s+\d+\s*:?\s*(.*)$/i.exec(beat);
        heading.textContent = 'Frame ' + (index + 1) + (index === 2 ? ' · Turn' : index === 3 ? ' · Punchline' : '');
        line.textContent = match ? match[1] : beat;
        item.appendChild(heading);
        item.appendChild(line);
        reveal.appendChild(item);
      });
      if (readingImages) {
        chosen.forEach(function (card, index) {
          var item = document.createElement('li');
          var image = document.createElement('img');
          var label = document.createElement('span');
          image.src = card.querySelector('img').src;
          image.alt = card.querySelector('img').alt;
          label.textContent = 'Frame ' + (index + 1);
          item.appendChild(image);
          item.appendChild(label);
          readingImages.appendChild(item);
        });
      }
      if (readingTitle) { readingTitle.textContent = story.title || 'One possible reading'; }
      if (question) { question.textContent = story.readerQuestion || ''; }
      if (reading) { reading.hidden = false; }
      if (completion) { completion.hidden = true; }
      if (intro) { intro.hidden = true; }
      if (timer) { timer.textContent = 'An authored reading is ready. Change the order to read another one.'; }
      say(story.title + ' is ready. It uses Picture ' + chosen.map(function (card) {
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
        if (intro) { intro.hidden = false; }
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
