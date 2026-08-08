/* ==========================================================================
   FOUR FRAMES — the Help Centre
   Two small jobs, both of which the page survives without.

   1. ?topic= deep links. The ? button in the bottom bar of every page sends
      the student to the topic that matches the page they left — from 4 Build
      it opens on "When it breaks", not on a menu (help-centre-content.md
      0.1). The four topics are real ids, so the link works as a plain
      anchor with JavaScript off; this only adds the landing highlight, the
      active chip and a spoken announcement of where they have arrived.

   2. "Back to where I was" uses the browser's own history (design spec 3.6),
      because the student could have come from any of seven pages. The link's
      href is Home, so with no JavaScript, or with nothing in the history,
      the student still lands somewhere real rather than nowhere.

   No storage. No network. Nothing is remembered between visits.
   ========================================================================== */

(function () {
  'use strict';

  var TOPICS = ['slides-basics', 'finding-images', 'crediting-images', 'when-it-breaks'];

  /* ONE live region, reused. The first version made a new one on every
     announcement, which left a growing stack of live regions on the page —
     a screen reader has to keep watching all of them, and a repeated message
     can be read from the wrong one. */
  function liveRegion() {
    var region = document.getElementById('ff-help-live');
    if (region) { return region; }
    region = document.createElement('p');
    region.id = 'ff-help-live';
    region.className = 'visually-hidden';
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
    return region;
  }

  function announce(message) {
    var region = liveRegion();
    region.textContent = '';
    window.setTimeout(function () { region.textContent = message; }, 60);
  }

  function requestedTopic() {
    var match = window.location.search.match(/[?&]topic=([^&]+)/);
    if (!match) { return null; }
    var wanted = decodeURIComponent(match[1]).toLowerCase();
    return TOPICS.indexOf(wanted) === -1 ? null : wanted;
  }

  function markChip(topic) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-chip]'), function (chip) {
      if (chip.getAttribute('data-chip') === topic) {
        chip.setAttribute('aria-current', 'true');
      } else {
        chip.removeAttribute('aria-current');
      }
    });
  }

  function goToTopic(topic, announceIt) {
    var section = document.getElementById(topic);
    if (!section) { return; }

    Array.prototype.forEach.call(document.querySelectorAll('.topic'), function (el) {
      el.classList.remove('is-target');
    });
    section.classList.add('is-target');
    markChip(topic);

    var reduced = window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (section.scrollIntoView) {
      section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }

    /* Move the keyboard, not only the scrollbar. This happens whether the
       student got here by pressing a chip or by pressing the ? button on
       another page — arriving at ?topic=when-it-breaks and finding the
       keyboard still at the top of the document is the same bug either way.
       tabindex="-1" makes the heading focusable without adding a Tab stop. */
    var heading = section.querySelector('h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }

    if (announceIt && heading) {
      announce(heading.textContent + '. ' + TOPICS.length + ' topics on this page.');
    }
  }

  function start() {
    var topic = requestedTopic();
    if (topic) { goToTopic(topic, true); }

    /* The chips do the same thing as the query parameter, so the highlight
       follows the student around the page rather than only on arrival. */
    Array.prototype.forEach.call(document.querySelectorAll('[data-chip]'), function (chip) {
      chip.addEventListener('click', function (event) {
        event.preventDefault();
        goToTopic(chip.getAttribute('data-chip'), false);
      });
    });

    var back = document.querySelector('[data-back-to-where]');
    if (back) {
      back.addEventListener('click', function (event) {
        /* history.length is 1 when this page is the only entry — a fresh tab,
           or a bookmark. Then the href does its job and takes them Home. */
        if (window.history.length > 1) {
          event.preventDefault();
          window.history.back();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
