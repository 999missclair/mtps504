/* Four Frames — the feeling-and-place stimulus from 3 Plan.
   A student picks up to three feelings and types one place. Both are saved to
   localStorage['ff-stimulus'] and reappear in the Comic Builder's picture finder
   as one-tap search words, so the planning step does real work later instead of
   being a form they fill in and never see again.
   Device-only storage: no account, no cookie, nothing leaves the machine. */
(function () {
  'use strict';

  var KEY = 'ff-stimulus';
  var MAX = 3;

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && typeof v === 'object') {
        return { moods: Array.isArray(v.moods) ? v.moods : [], place: v.place || '' };
      }
    } catch (e) {}
    return { moods: [], place: '' };
  }
  function write(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var chips = document.querySelectorAll('[data-mood]');
  var placeInput = document.querySelector('[data-place]');
  var note = document.querySelector('[data-mood-note]');
  if (!chips.length && !placeInput) { return; }

  var state = read();

  function describe() {
    if (!note) { return; }
    var bits = [];
    if (state.moods.length) { bits.push(state.moods.join(', ')); }
    if (state.place) { bits.push(state.place); }
    note.textContent = bits.length
      ? 'Saved: ' + bits.join(' · ') + '. These follow you to the Comic Builder.'
      : 'Nothing chosen yet.';
  }

  function paint() {
    chips.forEach(function (chip) {
      var on = state.moods.indexOf(chip.textContent.trim()) !== -1;
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      /* Full is full — but a chosen chip can always be turned off, so a student
         is never stuck with a choice they regret. */
      chip.disabled = !on && state.moods.length >= MAX;
    });
    describe();
  }

  chips.forEach(function (chip) {
    chip.setAttribute('aria-pressed', 'false');
    chip.addEventListener('click', function () {
      var word = chip.textContent.trim();
      var at = state.moods.indexOf(word);
      if (at !== -1) { state.moods.splice(at, 1); }
      else if (state.moods.length < MAX) { state.moods.push(word); }
      write(state);
      paint();
    });
  });

  if (placeInput) {
    placeInput.value = state.place;
    placeInput.addEventListener('input', function () {
      state.place = placeInput.value.trim().slice(0, 60);
      write(state);
      describe();
    });
  }

  paint();
}());
