/* Four Frames — first-visit route choice.
   A newcomer can follow the project phases in order; a returning student can
   move freely. This is a device-only learning preference, not an account,
   login or behavioural record. The real project brief remains available as
   soon as its place in the route is reached, and Help/Safety stay open at all
   times. With JavaScript off, every page remains available. */
(function () {
  'use strict';

  /* The local review overlay is an opt-in development aid. It is never loaded
     for ordinary student visits. */
  if (new URLSearchParams(location.search).has('dev-comments')) {
    var devComments = document.createElement('script');
    devComments.src = 'js/dev-comments.js';
    devComments.defer = true;
    document.head.appendChild(devComments);
  }

  var MODE_KEY = 'ff-route-mode';
  var PROGRESS_KEY = 'ff-route-highest-phase';
  var STEP_KEY = 'ff-route-steps';
  var phases = [
    { file: 'index.html', name: 'Home' },
    { file: 'brief.html', name: 'The Brief' },
    { file: 'look.html', name: '1 Look' },
    { file: 'roll.html', name: '2 Roll' },
    { file: 'plan.html', name: '3 Plan' },
    { file: 'build.html', name: '4 Build' },
    { file: 'share.html', name: '5 Share' }
  ];
  var phaseByFile = {};
  phases.forEach(function (phase, i) { phaseByFile[phase.file] = i; });
  /* These are Build tools, not extra phases. A new student reaches them only
     after arriving at 4 Build; Help and Safety remain support at any point. */
  var buildTools = { 'bank.html': 5, 'canvas.html': 5 };

  function read(key) {
    try { return localStorage.getItem(key) || ''; } catch (e) { return ''; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function fileFrom(url) {
    var path = new URL(url, location.href).pathname;
    return path.split('/').pop() || 'index.html';
  }
  function currentFile() { return fileFrom(location.href); }
  function mode() {
    var value = read(MODE_KEY);
    return value === 'guided' || value === 'free' ? value : '';
  }
  function highest() {
    var value = parseInt(read(PROGRESS_KEY), 10);
    return Number.isFinite(value) ? Math.max(-1, Math.min(value, phases.length - 1)) : -1;
  }
  function allowed(file) {
    if (mode() !== 'guided') return true;
    /* Build's own tools unlock when Build itself becomes reachable, not when it is
       finished. The Builder IS the first step of Build, so requiring Build to be
       complete locked students out of the step that completes it. */
    if (Object.prototype.hasOwnProperty.call(buildTools, file)) return highest() + 1 >= buildTools[file];
    if (!Object.prototype.hasOwnProperty.call(phaseByFile, file)) return true;
    return phaseByFile[file] <= highest() + 1;
  }
  function nextName(file) {
    if (Object.prototype.hasOwnProperty.call(buildTools, file)) return '4 Build';
    var phase = phaseByFile[file];
    if (typeof phase === 'number') return phases[Math.min(phase, highest() + 1)].name;
    return 'the next project page';
  }
  function nextPage() {
    return phases[Math.min(highest() + 1, phases.length - 1)];
  }
  function showNudge(target) {
    var nudge = document.querySelector('.route-nudge');
    if (!nudge) return;
    nudge.textContent = 'Follow the story strip in order. Next: ' + nextName(target) + '.';
    nudge.hidden = false;
    window.clearTimeout(showNudge.timer);
    showNudge.timer = window.setTimeout(function () { nudge.hidden = true; }, 5200);
  }
  function lockLink(link, message) {
    if (!link.hasAttribute('data-route-original-title')) {
      link.setAttribute('data-route-original-title', link.getAttribute('title') || '');
    }
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('data-route-locked', '');
    link.setAttribute('title', message);
  }
  function clearLocks() {
    document.querySelectorAll('[data-route-locked]').forEach(function (link) {
      link.removeAttribute('data-route-locked');
      link.removeAttribute('aria-disabled');
      if (link.hasAttribute('data-route-original-title')) {
        var oldTitle = link.getAttribute('data-route-original-title');
        if (oldTitle) link.setAttribute('title', oldTitle);
        else link.removeAttribute('title');
        link.removeAttribute('data-route-original-title');
      }
    });
  }
  function stepPills() {
    return Array.prototype.slice.call(document.querySelectorAll('.botnav .step-pill'));
  }
  function readSteps() {
    try {
      var value = JSON.parse(read(STEP_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch (e) { return {}; }
  }
  function stepHighest(file) {
    var value = parseInt(readSteps()[file], 10);
    return Number.isFinite(value) ? value : -1;
  }
  function writeStep(index) {
    var all = readSteps();
    var file = currentFile();
    var stored = parseInt(all[file], 10);
    if (!Number.isFinite(stored)) stored = -1;
    if (stored < index) {
      all[file] = index;
      write(STEP_KEY, JSON.stringify(all));
    }
  }
  function stepAllowed(index) {
    return mode() !== 'guided' || index <= stepHighest(currentFile()) + 1;
  }
  function completeCurrentPhase() {
    if (mode() !== 'guided') return;
    var phase = phaseByFile[currentFile()];
    if (typeof phase !== 'number' || phase !== highest() + 1) return;
    write(PROGRESS_KEY, String(phase));
  }
  function recordStep(index, count) {
    if (mode() !== 'guided' || !stepAllowed(index)) return false;
    writeStep(index);
    if (index >= count - 1) completeCurrentPhase();
    updateNav();
    return true;
  }
  function updateNav() {
    clearLocks();
    if (mode() !== 'guided') return;
    document.querySelectorAll('.topnav a[href]').forEach(function (link) {
      var target = fileFrom(link.href);
      if (!allowed(target)) {
        lockLink(link, 'Follow the project in order. Next: ' + nextPage().name + '.');
      }
    });
    stepPills().forEach(function (pill, index) {
      if (!stepAllowed(index)) lockLink(pill, 'Open the current step before moving on.');
    });
  }
  function protectDirectURL() {
    if (mode() !== 'guided') return false;
    var file = currentFile();
    if (allowed(file)) return false;
    location.replace(new URL(nextPage().file, location.href).href);
    return true;
  }
  function protectCurrentStep() {
    if (mode() !== 'guided') return false;
    var pills = stepPills();
    if (!pills.length) { completeCurrentPhase(); return false; }
    var active = pills.findIndex(function (pill) { return pill.getAttribute('aria-current') === 'step'; });
    if (active < 0) active = 0;
    if (stepAllowed(active)) {
      recordStep(active, pills.length);
      return false;
    }
    var allowedIndex = Math.max(0, stepHighest(currentFile()) + 1);
    location.replace(new URL(currentFile() + (pills[allowedIndex].getAttribute('href') || ''), location.href).href);
    return true;
  }
  function addHelpReset(dialog, openChoice) {
    if (currentFile() !== 'help.html') return;
    var intro = document.querySelector('.help-intro');
    if (!intro || intro.querySelector('[data-route-reset]')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'route-reset';
    button.setAttribute('data-route-reset', '');
    button.textContent = 'Choose my route again';
    button.addEventListener('click', openChoice);
    intro.appendChild(button);
  }
  function buildDialog() {
    var bot = document.querySelector('.botnav');
    if (bot) {
      var setBottomInset = function () {
        document.documentElement.style.setProperty('--nav-b-live', bot.getBoundingClientRect().height + 'px');
      };
      setBottomInset();
      if (window.ResizeObserver) new ResizeObserver(setBottomInset).observe(bot);
    }
    var nudge = document.createElement('p');
    nudge.className = 'route-nudge';
    nudge.hidden = true;
    nudge.setAttribute('role', 'status');
    document.body.appendChild(nudge);
    var dialog = document.createElement('dialog');
    dialog.className = 'route-dialog';
    dialog.setAttribute('aria-labelledby', 'route-title');
    dialog.innerHTML =
      '<div class="route-dialog__inner">' +
        '<p class="phase-tag">Four Frames studio</p>' +
        '<h2 id="route-title">Choose your route</h2>' +
        '<p>Every page gives your comic a new tool: camera clues, a story deal, four beats, then your finished strip.</p>' +
        '<p class="small">Choose the route that fits today. This choice stays only on this device, and you can change it in Help.</p>' +
        '<div class="route-dialog__choices">' +
          '<button type="button" class="btn-primary" data-route-new>I\'m new<span class="route-dialog__detail">Start with the project overview, then open each phase in order.</span></button>' +
          '<button type="button" class="btn-secondary" data-route-return>Welcome Back<span class="route-dialog__detail">Use every page whenever you need it.</span></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(dialog);

    function close() {
      if (dialog.open && dialog.close) dialog.close();
      else dialog.removeAttribute('open');
    }
    function openChoice() {
      dialog.querySelector('#route-title').textContent = 'Choose your route';
      if (dialog.showModal && !dialog.open) dialog.showModal();
      else dialog.setAttribute('open', '');
      dialog.querySelector('[data-route-new]').focus();
    }
    dialog.querySelector('[data-route-new]').addEventListener('click', function () {
      write(MODE_KEY, 'guided');
      /* Choosing a route is the Home-page activity. Mark Home complete so the
         visible “Project overview” action is the first available destination. */
      write(PROGRESS_KEY, '0');
      try { localStorage.removeItem(STEP_KEY); } catch (e) {}
      close();
      location.replace(new URL('index.html', location.href).href);
    });
    dialog.querySelector('[data-route-return]').addEventListener('click', function () {
      write(MODE_KEY, 'free');
      close();
      updateNav();
    });
    dialog.addEventListener('cancel', function (event) {
      if (!mode()) event.preventDefault();
    });
    addHelpReset(dialog, openChoice);
    return openChoice;
  }

  var openChoice = buildDialog();
  /* A capture handler makes the lock apply to top nav, bottom nav and direct
     in-page links without changing their plain-HTML fallback behaviour. */
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link) return;
    if (mode() === 'guided' && link.classList.contains('step-pill') && link.closest('.botnav')) {
      var pills = stepPills();
      var step = pills.indexOf(link);
      if (!stepAllowed(step)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var stepNudge = document.querySelector('.route-nudge');
        if (stepNudge) {
          stepNudge.textContent = 'Open the current step before moving on.';
          stepNudge.hidden = false;
          window.clearTimeout(showNudge.timer);
          showNudge.timer = window.setTimeout(function () { stepNudge.hidden = true; }, 5200);
        }
        return;
      }
    }
    var target = fileFrom(link.href);
    if (allowed(target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showNudge(target);
  }, true);

  if (!mode()) {
    openChoice();
    return;
  }
  if (protectDirectURL()) return;
  if (protectCurrentStep()) return;
  updateNav();
  document.addEventListener('ff-step-shown', function (event) {
    if (mode() !== 'guided' || !event.detail) return;
    if (!recordStep(event.detail.index, event.detail.count)) protectCurrentStep();
  });
})();
