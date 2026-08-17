/* Four Frames — rolled-story banner.
   The dice on 2 Roll save the locked brief to localStorage (key 'ff-brief');
   this fills any [data-brief-banner] slot on later pages so the student can
   always see the story they were dealt — it's what goes in the four cells.
   ponytail: one tiny reader, no framework. If nothing's rolled, it invites
   them to roll; it never errors. Device-only storage, no account, no cookie. */
(function () {
  'use strict';
  var slots = document.querySelectorAll('[data-brief-banner]');
  if (!slots.length) return;

  var brief = null;
  try { brief = JSON.parse(localStorage.getItem('ff-brief') || 'null'); } catch (e) {}

  slots.forEach(function (slot) {
    slot.innerHTML = '';
    if (brief && (brief.text || brief.character)) {
      var line = brief.text ||
        [brief.character, brief.situation, brief.problem].filter(Boolean).join(' · ');
      var lab = document.createElement('p');
      lab.className = 'brief-banner__label';
      lab.textContent = 'Your story';
      var val = document.createElement('p');
      val.className = 'brief-banner__line';
      val.textContent = line;
      slot.appendChild(lab);
      slot.appendChild(val);
      slot.classList.add('is-set');
    } else {
      if (slot.hasAttribute('data-brief-recovery')) {
        var recovery = document.createElement('a');
        recovery.className = 'btn-primary';
        recovery.href = 'roll.html#roll';
        recovery.textContent = 'Roll a brief first →';
        slot.appendChild(recovery);
      } else {
        var p = document.createElement('p');
        p.className = 'brief-banner__empty';
        p.innerHTML = 'No story yet — <a href="roll.html">roll yours on 2 Roll</a>, ' +
          'then it follows you here.';
        slot.appendChild(p);
      }
    }
  });
})();
