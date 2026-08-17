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
    var routes = all(root, '[data-story-route]');
    var chosen = [];
    var routeIndex = -1;
    var timerId = null;

    function say(message) {
      if (live) { live.textContent = message; }
    }

    function clearRoute() {
      routes.forEach(function (route) { route.removeAttribute('aria-current'); });
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

      if (completion) { completion.hidden = chosen.length !== 4; }
      if (result) {
        if (chosen.length < 4) {
          result.textContent = chosen.length + ' of 4 frames chosen. Choose in reading order.';
        } else {
          var ids = chosen.map(function (card) { return card.getAttribute('data-story-card'); }).join(',');
          var match = routes.filter(function (route) { return route.getAttribute('data-story-route') === ids; })[0];
          if (match) {
            clearRoute();
            match.setAttribute('aria-current', 'true');
            result.textContent = 'This route works: frame 3 is the absurd turn; frame 4 lands the visual joke.';
          } else {
            result.textContent = 'Your sequence can work too. Check that frame 3 changes the situation and frame 4 makes the reader re-think it.';
          }
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
      paintSlots();
    }

    function chooseRoute(route, spoken) {
      clearRoute();
      route.setAttribute('aria-current', 'true');
      if (timer) { timer.textContent = 'Try this route: ' + route.getAttribute('data-story-name') + '.'; }
      if (spoken) { say('Story prompt: ' + route.getAttribute('data-story-name') + '.'); }
    }

    cards.forEach(function (card) {
      card.setAttribute('aria-pressed', 'false');
      card.addEventListener('click', function () { choose(card); });
    });

    routes.forEach(function (route) {
      route.addEventListener('click', function () { chooseRoute(route, true); });
    });

    if (clear) {
      clear.addEventListener('click', function () {
        chosen = [];
        clearRoute();
        paintSlots();
        say('Four frames cleared.');
      });
    }

    if (think) {
      think.addEventListener('click', function () {
        if (timerId) { return; }
        var seconds = 5;
        think.disabled = true;
        if (timer) { timer.textContent = 'Thinking up a new story … ' + seconds; }
        say('Take five seconds to picture a different story.');
        timerId = window.setInterval(function () {
          seconds -= 1;
          if (seconds > 0) {
            if (timer) { timer.textContent = 'Thinking up a new story … ' + seconds; }
            return;
          }
          window.clearInterval(timerId);
          timerId = null;
          routeIndex = (routeIndex + 1) % routes.length;
          chooseRoute(routes[routeIndex], true);
          think.disabled = false;
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
