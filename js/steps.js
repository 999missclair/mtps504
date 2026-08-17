/* Four Frames — bottom-nav pager.
   Turns each page into one-screen steps instead of one long scroll.
   The bottom nav already carries the pills, the counter and the forward button;
   this makes them switch sections rather than jump down the page.

   ponytail: progressive enhancement. If this file never runs, every section
   stays visible and the pills fall back to plain anchor jumps — which is
   exactly what the page did before. Nothing here is load-bearing for content. */
(function () {
  'use strict';

  var bot = document.querySelector('.botnav');
  if (!bot) return;

  /* `--nav-b` is the intended one-row height. At zoom or in a narrow desktop
     window, the real bottom bar can wrap. The fit canvas must reserve the
     *measured* height or its last content is hidden behind the bar. Keeping
     this as a CSS variable also positions the support drawer and toast above
     the real bar, rather than a guessed height. */
  function setBottomInset() {
    document.documentElement.style.setProperty('--nav-b-live', bot.getBoundingClientRect().height + 'px');
  }
  setBottomInset();
  if (window.ResizeObserver) {
    new ResizeObserver(setBottomInset).observe(bot);
  } else {
    window.addEventListener('resize', setBottomInset);
  }

  /* At the exact 768px portrait target the phase links form a deliberate
     horizontal strip between pinned Home and Help links. Bring this page's
     phase into view on arrival, so the useful location cue is never the item
     hidden just beyond the strip's edge. */
  var currentPhase = document.querySelector('.topnav__link[aria-current="page"]');
  if (currentPhase && window.matchMedia('(max-width: 48rem)').matches && currentPhase.scrollIntoView) {
    window.requestAnimationFrame(function () {
      currentPhase.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
  }

  var pills = Array.prototype.slice.call(bot.querySelectorAll('.step-pill'));
  if (pills.length < 2) return;

  var main = document.querySelector('main');
  if (!main) return;
  var stepCanvas = main.querySelector('.with-rail > div:first-child');

  /* Content sections only — the support rail (Stuck / What good looks like)
     stays put on every step, so it never scrolls away from a student who needs it. */
  var all = Array.prototype.slice.call(main.querySelectorAll('.section'))
    .filter(function (s) { return !s.closest('.rail'); });
  if (!all.length) return;

  var targets = pills.map(function (p) {
    var h = p.getAttribute('href') || '';
    return h.charAt(0) === '#' ? h.slice(1) : '';
  });

  /* Group sections into steps, always in the order they appear on the page.
     A section without its own pill belongs to the step above it.

     Some pills point at ids that don't exist (4 Build shipped with #find and
     #export and no sections to match). Rather than bail and leave the student
     with an eight-screen scroll, fall back to one step per titled section and
     rebuild the pills from the headings. Self-healing beats trusting the hrefs. */
  var starts = all.filter(function (s) { return s.id && targets.indexOf(s.id) > -1; });
  var healed = false;

  if (starts.length !== pills.length) {
    starts = all.filter(function (s) { return !!s.id; });
    healed = true;
  }
  if (starts.length < 2) return;

  var groups = starts.map(function () { return []; });
  var g = 0;
  all.forEach(function (sec) {
    var at = starts.indexOf(sec);
    if (at > -1) g = at;
    groups[g].push(sec);
  });
  targets = starts.map(function (s) { return s.id; });

  if (healed) {
    var list = pills[0].parentNode.parentNode; /* the <ul> */
    list.innerHTML = '';
    pills = starts.map(function (s, i) {
      var heading = s.querySelector('h2, h3');
      var full = heading ? heading.textContent.replace(/^\s*[\d.·\-\s]+/, '').trim() : 'Step ' + (i + 1);
      /* Pills sit in a fixed-width bar, so a whole heading won't fit. Cut at the
         first bit of punctuation, then to three words — "Quick check: what can
         you actually use?" becomes "Quick check". */
      var text = full.split(/[—:,?(]/)[0].trim().split(/\s+/).slice(0, 3).join(' ');
      if (text.length > 22) text = text.slice(0, 21).trim() + '…';
      /* Past five steps, named pills overflow the bar and start repeating
         ("Going further" twice on 4 Build). Numbers always fit, and the counter
         beside them says the step's name in full. */
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'step-pill';
      a.setAttribute('href', '#' + s.id);
      a.setAttribute('title', full);
      a.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + full);
      a.textContent = starts.length > 5 ? String(i + 1) : (i + 1) + ' ' + text;
      li.appendChild(a);
      list.appendChild(li);
      return a;
    });
    if (pills.length > 5) list.classList.add('botnav__steps--chips');
  }

  var counter = bot.querySelector('.botnav__counter');
  var countEl = counter && counter.querySelector('.count');
  var nameEl = counter && counter.querySelector('.name');
  var fwd = bot.querySelector('.btn-primary');
  var fwdHTML = fwd ? fwd.innerHTML : '';
  var fwdHref = fwd ? fwd.getAttribute('href') : '';

  /* Where "next" goes from the last step: the next page in the top nav. */
  var here = location.pathname.split('/').pop() || 'index.html';
  var topLinks = Array.prototype.slice.call(document.querySelectorAll('.topnav a[href$=".html"]'));
  var at = -1;
  topLinks.forEach(function (a, i) { if (a.getAttribute('href') === here) at = i; });
  var nextPage = at > -1 && topLinks[at + 1] ? topLinks[at + 1] : null;

  var back = bot.querySelector('.botnav__back');
  var backHTML = back ? back.innerHTML : '';
  var backHref = back ? back.getAttribute('href') : '';

  var current = -1;

  var help = bot.querySelector('.botnav__help');
  var helpHref = help ? help.getAttribute('href') : '';

  /* Which Help Centre topic each step should open on. Anything not listed
     falls back to the page's own default. */
  var helpTopics = {
    scramble: 'when-it-breaks',
    roll: 'builder-basics',
    lock: 'builder-basics',
    post: 'when-it-breaks',
    'build-it': 'when-it-breaks',
    'get-pictures': 'finding-images',
    exemplar: 'builder-basics',
    'alt-text': 'builder-basics',
    steps: 'when-it-breaks',
    sources: 'finding-images',
    'bank-handoff': 'finding-images',
    'licence-sort': 'crediting-images'
  };

  var live = document.createElement('p');
  live.className = 'visually-hidden';
  live.setAttribute('aria-live', 'polite');
  bot.appendChild(live);

  /* Swipe between steps on a touch screen. iPad is a design target and a
     thumb-drag is the gesture a thirteen-year-old will try first. */
  var x0 = null, y0 = null;
  main.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  main.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    var dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    /* Only a deliberate sideways drag — never hijack a scroll, and never
       steal a drag from the Panel Scramble or the licence sort. */
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) {
      if (e.target.closest('[draggable], .sortable, [class*="drag"]')) return;
      show(dx < 0 ? current + 1 : current - 1, true);
    }
  }, { passive: true });

  function label(i) {
    var p = pills[i];
    if (!p) return '';
    /* Past five steps the pills are bare numbers, so their text is no use as a
       label — the full heading is kept on the title attribute for exactly this.
       Without it the forward button on 4 Build reads as a lone arrow. */
    var t = (p.getAttribute('title') || '').trim();
    var own = p.textContent.replace(/^\s*\d+\s*/, '').trim();
    var text = own || t;
    if (!own && t) text = t.split(/[—:,?(]/)[0].trim();
    return text || ('Step ' + (i + 1));
  }

  function show(i, push) {
    if (i < 0 || i >= groups.length || i === current) return;
    current = i;

    groups.forEach(function (secs, n) {
      secs.forEach(function (s) { s.hidden = n !== i; });
    });

    pills.forEach(function (p, n) {
      if (n === i) p.setAttribute('aria-current', 'step');
      else p.removeAttribute('aria-current');
    });

    if (countEl) countEl.textContent = (i + 1) + ' / ' + groups.length;
    if (nameEl) nameEl.textContent = label(i);

    /* Forward button: next step, then off to the next page at the end. */
    if (fwd) {
      if (i < groups.length - 1) {
        fwd.setAttribute('href', '#' + (targets[i + 1] || ''));
        fwd.innerHTML = label(i + 1) + ' →';
      } else if (nextPage) {
        fwd.setAttribute('href', nextPage.getAttribute('href'));
        /* Top-nav links carry two lines — "3 Plan" and the phase beneath it.
           Take only the first, or the button reads "3 PLAN DESIGNING". */
        var first = nextPage.querySelector('.topnav__label') || nextPage.querySelector('span');
        var name = (first ? first.textContent : nextPage.textContent).replace(/\s+/g, ' ').trim();
        fwd.innerHTML = name + ' →';
      } else {
        fwd.setAttribute('href', fwdHref);
        fwd.innerHTML = fwdHTML;
      }
    }

    /* Back button: previous step, or back off the page from step one. */
    if (back) {
      if (i > 0) {
        back.setAttribute('href', '#' + (targets[i - 1] || ''));
        back.innerHTML = '<span aria-hidden="true">←</span> <span class="label" aria-hidden="true">' +
          label(i - 1) + '</span><span class="visually-hidden">Back to ' + label(i - 1) + '</span>';
      } else {
        back.setAttribute('href', backHref);
        back.innerHTML = backHTML;
      }
    }

    if (push) history.replaceState(null, '', '#' + (targets[i] || ''));

    /* Keep the step you're on visible in the bar. On an iPad the pills scroll
       sideways, and step 6 of 8 sits off the edge until you drag it back. */
    if (pills[i] && pills[i].scrollIntoView) {
      pills[i].scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    /* Say the step out loud for anyone using a screen reader — the content
       swaps without the page reloading, so nothing would announce it otherwise. */
    if (live) live.textContent = 'Step ' + (i + 1) + ' of ' + groups.length + ': ' + label(i);

    /* Route.js listens for this after the pager has changed the visible step.
       The route may then unlock the next bottom-nav pill for a newcomer;
       returning students are unaffected. */
    document.dispatchEvent(new CustomEvent('ff-step-shown', {
      detail: { id: targets[i] || '', index: i, count: groups.length }
    }));

    /* Point the ? at help for the step you're actually on. */
    if (help && helpTopics[targets[i]]) {
      help.setAttribute('href', 'help.html?topic=' + helpTopics[targets[i]]);
    } else if (help) {
      help.setAttribute('href', helpHref);
    }

    /* Send focus to the step's own heading so a keyboard or screen-reader user
       lands in the new content instead of staying stranded in the nav. */
    var h = groups[i][0].querySelector('h2, h3');
    if (h) {
      if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    function resetStepScroll() {
      if (stepCanvas) stepCanvas.scrollTop = 0;
      window.scrollTo(0, 0);
    }
    resetStepScroll();
    /* A direct #step link can make the browser perform its native anchor
       scroll after scripts run. Reset once more on the next frame so every
       pager step starts at its own heading. */
    window.requestAnimationFrame(resetStepScroll);
    window.setTimeout(resetStepScroll, 50);
  }

  function goTo(hash) {
    var i = targets.indexOf((hash || '').replace('#', ''));
    if (i > -1) show(i, true);
  }

  document.documentElement.classList.add('has-steps');

  bot.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || !bot.contains(a)) return;
    var i = targets.indexOf(a.getAttribute('href').slice(1));
    if (i > -1) { e.preventDefault(); show(i, true); }
  });

  /* In-page links from the content itself — "jump to the scramble" and friends. */
  main.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var i = targets.indexOf(a.getAttribute('href').slice(1));
    if (i > -1) { e.preventDefault(); show(i, true); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || e.target.isContentEditable) return;
    if (e.key === 'ArrowRight') show(current + 1, true);
    if (e.key === 'ArrowLeft') show(current - 1, true);
  });

  window.addEventListener('hashchange', function () { goTo(location.hash); });

  var start = targets.indexOf((location.hash || '').replace('#', ''));
  show(start > -1 ? start : 0, false);
})();
