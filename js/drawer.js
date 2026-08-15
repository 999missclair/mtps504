/* Support drawer for fit-mode pages. The rail (Stuck? / checklist) slides in
   from the right instead of sitting on every step. Progressive enhancement:
   only runs in fit mode; without JS the rail is a normal, readable block. */
(function () {
  'use strict';
  if (!document.body.classList.contains('fit')) return;
  var rail = document.querySelector('.rail');
  var scrim = document.querySelector('.rail-scrim');
  var toggle = document.querySelector('.rail-toggle');
  if (!rail || !toggle) return;
  var closeBtn = rail.querySelector('.rail__close');
  var heading = rail.querySelector('h2');
  if (heading && !heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');

  rail.setAttribute('aria-hidden', 'true'); // starts closed (JS is running)

  function open() {
    rail.classList.add('is-open');
    if (scrim) scrim.classList.add('is-open');
    rail.setAttribute('aria-hidden', 'false');
    if (heading) heading.focus({ preventScroll: true });
  }
  function close() {
    rail.classList.remove('is-open');
    if (scrim) scrim.classList.remove('is-open');
    rail.setAttribute('aria-hidden', 'true');
    toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (scrim) scrim.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && rail.classList.contains('is-open')) close();
  });
})();
