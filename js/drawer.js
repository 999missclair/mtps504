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
  var focusableSelector = 'a[href], area[href], button, input, select, textarea, iframe, object, embed, [contenteditable], [tabindex]';
  var storedTabindex = 'data-drawer-tabindex';

  if (!rail.id) rail.id = 'support-drawer';
  rail.setAttribute('role', 'dialog');
  rail.setAttribute('aria-modal', 'true');
  if (heading) {
    if (!heading.id) heading.id = 'support-drawer-title';
    rail.setAttribute('aria-labelledby', heading.id);
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  }
  toggle.setAttribute('aria-controls', rail.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-haspopup', 'dialog');

  function setClosedState(closed) {
    rail.setAttribute('aria-hidden', closed ? 'true' : 'false');
    rail.toggleAttribute('inert', closed);

    /* inert is supported by current target browsers. Keep a tabindex fallback
       so the closed, off-screen rail is never reached on older school devices. */
    if (closed) {
      Array.prototype.forEach.call(rail.querySelectorAll(focusableSelector), function (item) {
        if (item.tabIndex < 0 || item.hasAttribute(storedTabindex)) return;
        item.setAttribute(storedTabindex, item.hasAttribute('tabindex') ? item.getAttribute('tabindex') : '');
        item.setAttribute('tabindex', '-1');
      });
    } else {
      Array.prototype.forEach.call(rail.querySelectorAll('[' + storedTabindex + ']'), function (item) {
        var original = item.getAttribute(storedTabindex);
        if (original) item.setAttribute('tabindex', original);
        else item.removeAttribute('tabindex');
        item.removeAttribute(storedTabindex);
      });
    }
  }

  function drawerTabStops() {
    return Array.prototype.filter.call(rail.querySelectorAll(focusableSelector), function (item) {
      return !item.disabled && item.tabIndex >= 0;
    });
  }

  setClosedState(true); // starts closed only once the enhancement is running
  document.body.classList.add('has-drawer');

  function open() {
    if (rail.classList.contains('is-open')) return;
    rail.classList.add('is-open');
    if (scrim) scrim.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    setClosedState(false);
    (closeBtn || heading || rail).focus({ preventScroll: true });
  }
  function close() {
    if (!rail.classList.contains('is-open')) return;
    rail.classList.remove('is-open');
    if (scrim) scrim.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    setClosedState(true);
    toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', function () {
    if (rail.classList.contains('is-open')) close();
    else open();
  });
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (scrim) scrim.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (!rail.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;

    var stops = drawerTabStops();
    if (!stops.length) {
      e.preventDefault();
      rail.focus({ preventScroll: true });
      return;
    }
    var first = stops[0];
    var last = stops[stops.length - 1];
    if (e.shiftKey && (document.activeElement === first || !rail.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (document.activeElement === last || !rail.contains(document.activeElement))) {
      e.preventDefault();
      first.focus();
    }
  });
})();
