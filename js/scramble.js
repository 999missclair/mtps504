/* ==========================================================================
   FOUR FRAMES — the sort board
   Built for A1 Panel Scramble (page 3). Written as one reusable module so the
   licence sort on 4 Build can be a second instance of it with different
   markup and no new JavaScript (activity-designs.md, "Build responsibilities").

   Rules this file keeps, and they are claims made in the video rationale:
   - No storage of any kind. No localStorage, no sessionStorage, no cookie.
     Reload the page and the board resets, and the site never claims to
     remember a student between lessons.
   - No drag path. Tap the item, then tap the bin. Every item and every bin is
     a real <button>, so the keyboard does exactly the same task: Enter or
     Space picks an item up, Tab moves to a bin, Enter or Space drops it,
     Escape puts it back.
   - No copy lives in here. Every word a student reads — titles, bin labels,
     bin definitions, all eighteen feedback lines — is written in the HTML and
     read out of data attributes. A copy pass edits the page, not the script.
   - No network requests. Nothing is fetched, nothing is sent.

   Markup contract (see look.html for the worked instance)
     [data-sortboard]                the root
         data-pick-first             the line shown when a bin is tapped with
                                     nothing picked up yet
       [data-sort-item]              an item button
         data-title                  the item's short name, for announcements
         data-correct                the id of the correct bin in three-bin mode
         data-correct-two            the id of the correct bin in two-bin mode
         data-fb-<binid>             the feedback line for that bin, three-bin
         data-fb2-<binid>            the feedback line for that bin, two-bin
       [data-sort-bin]               a bin button
         data-bin                    this bin's id
         data-merged-into            (optional) the bin this one folds into
                                     when the two-bin scaffold is on
         data-label-two / data-sub-two   (optional) label and definition to
                                     show while the two-bin scaffold is on
       [data-sort-tray]              where unplaced items live
       [data-sort-progress]          the "3 of 6 placed." line
         data-done                   the line shown when everything is placed
       [data-sort-feedback]          the one-line feedback slot
       [data-sort-live]              the aria-live="polite" region
       [data-sort-scaffold]          the two-bin toggle button
         data-label-on / data-label-off
         data-say-on / data-say-off  what the live region says on each switch
       [data-sort-reveal]            revealed when every item is placed
   ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- helpers */

  function all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

  /* "establishing" -> "Establishing", for the spoken announcement. */
  function sentenceCase(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /* ------------------------------------------------------------- the board  */

  function initSortBoard(root) {
    var items    = all(root, '[data-sort-item]');
    var bins     = all(root, '[data-sort-bin]');
    var tray     = root.querySelector('[data-sort-tray]');
    var progress = root.querySelector('[data-sort-progress]');
    var feedback = root.querySelector('[data-sort-feedback]');
    var live     = root.querySelector('[data-sort-live]');
    var scaffold = root.querySelector('[data-sort-scaffold]');
    /* What the finished board reveals sits outside the board itself, so look
       for it in the whole section this board belongs to. */
    var scope    = root.closest('section') || document;
    var reveal   = scope.querySelector('[data-sort-reveal]');

    if (!items.length || !bins.length || !tray) { return null; }

    var held    = null;      /* the item currently picked up, or null */
    var twoBins = false;     /* is the two-bin scaffold on?           */
    var placed  = 0;

    /* A bin's id in whichever mode is running. A bin that absorbs another one
       under the two-bin scaffold answers to a different id while it does
       (MID becomes CLOSE IN), so the feedback lines can differ too. */
    function idOf(bin) {
      return (twoBins && bin.getAttribute('data-bin-two')) || bin.getAttribute('data-bin');
    }

    /* The bin an item belongs in, in whichever mode is running. */
    function correctBinFor(item) {
      return twoBins
        ? (item.getAttribute('data-correct-two') || item.getAttribute('data-correct'))
        : item.getAttribute('data-correct');
    }

    /* The line to show when this item is dropped in this bin. */
    function lineFor(item, binId) {
      var key = (twoBins ? 'data-fb2-' : 'data-fb-') + binId;
      return item.getAttribute(key) || item.getAttribute('data-fb-' + binId) || '';
    }

    function say(message) {
      if (live) { live.textContent = message; }
    }

    function showFeedback(text, isWrong) {
      if (!feedback) { return; }
      feedback.textContent = text;
      feedback.classList.toggle('is-wrong', !!isWrong);
    }

    /* A bin's shell holds the button and the list of what has been placed in
       it. Hiding, arming and the placed list all belong to the shell. */
    function shellOf(bin) { return bin.closest('[data-bin-shell]') || bin; }
    function placedList(bin) { return shellOf(bin).querySelector('[data-sort-placed]'); }

    function armBins(on) {
      bins.forEach(function (bin) {
        var shell = shellOf(bin);
        if (shell.hidden) { return; }
        shell.classList.toggle('is-armed', on);
      });
    }

    function drop() {
      if (!held) { return; }
      held.setAttribute('aria-pressed', 'false');
      held = null;
      armBins(false);
    }

    function pickUp(item) {
      if (held === item) { drop(); say('Put down.'); return; }
      if (held) { held.setAttribute('aria-pressed', 'false'); }
      held = item;
      item.setAttribute('aria-pressed', 'true');
      armBins(true);
      say(item.getAttribute('data-title') + '. Picked up. Now choose a bin.');
    }

    function countPlaced() {
      placed = items.filter(function (item) { return item.hidden; }).length;
      if (progress) {
        var done = placed === items.length && progress.getAttribute('data-done');
        progress.textContent = done
          ? progress.getAttribute('data-done')
          : placed + ' of ' + items.length + ' placed.';
      }
      if (reveal && placed === items.length) {
        reveal.hidden = false;
      }
    }

    /* Move an item into a bin's placed list and take it out of the tray. */
    function place(item, bin) {
      var list = placedList(bin);
      var entry = document.createElement('li');
      entry.textContent = item.getAttribute('data-title');
      if (list) { list.appendChild(entry); }
      item.hidden = true;
      item.setAttribute('aria-pressed', 'false');
      countPlaced();
    }

    function chooseBin(bin) {
      if (!held) {
        /* The word for what is being sorted differs per instance — panels on
           1 Look, images on 4 Build — so the line is read out of the markup
           like every other word a student sees. */
        showFeedback(
          root.getAttribute('data-pick-first')
            || 'Tap an item first, then tap the bin you want to put it in.',
          false
        );
        return;
      }
      var item  = held;
      var binId = idOf(bin);
      var title = item.getAttribute('data-title');
      var name  = sentenceCase(bin.querySelector('[data-bin-label]').textContent.trim());
      var right = correctBinFor(item) === binId;

      drop();

      if (right) {
        place(item, bin);
        showFeedback(lineFor(item, binId), false);
        say(title + '. Placed in ' + name + '. Correct.');
      } else {
        showFeedback(lineFor(item, binId), true);
        say(title + '. Not ' + name + ' — try again.');
        item.focus();
      }
    }

    /* ------------------------------------------------ the two-bin scaffold  */

    /* Merging keeps the wide placements, because those are still right at both
       resolutions. Anything already in a merged bin goes back to the tray when
       the three-bin task is restored: it was sorted at the coarser resolution,
       so it has not yet been split, and pretending otherwise would hand the
       student a tick they have not earned. */
    function returnToTray(bin) {
      var list = placedList(bin);
      if (!list) { return; }
      var names = all(list, 'li').map(function (li) { return li.textContent; });
      list.textContent = '';
      items.forEach(function (item) {
        if (names.indexOf(item.getAttribute('data-title')) !== -1) { item.hidden = false; }
      });
    }

    function setScaffold(on) {
      twoBins = on;
      drop();

      bins.forEach(function (bin) {
        var mergedInto = bin.getAttribute('data-merged-into');
        var labelEl = bin.querySelector('[data-bin-label]');
        var subEl   = bin.querySelector('[data-bin-sub]');

        if (on && mergedInto) {
          returnToTray(bin);
          shellOf(bin).hidden = true;
          return;
        }
        shellOf(bin).hidden = false;

        if (on && bin.getAttribute('data-label-two')) {
          returnToTray(bin);
          labelEl.textContent = bin.getAttribute('data-label-two');
          if (subEl) { subEl.textContent = bin.getAttribute('data-sub-two'); }
        } else if (!on && bin.getAttribute('data-label-two')) {
          returnToTray(bin);
          labelEl.textContent = bin.getAttribute('data-label-three');
          if (subEl) { subEl.textContent = bin.getAttribute('data-sub-three'); }
        }
      });

      if (scaffold) {
        scaffold.textContent = on
          ? scaffold.getAttribute('data-label-off')
          : scaffold.getAttribute('data-label-on');
        scaffold.setAttribute('aria-pressed', on ? 'true' : 'false');
      }

      countPlaced();
      showFeedback('', false);
      /* Also read out of the markup, so the bin names in the announcement can
         never drift from the bin names on the page. */
      say(on
        ? (scaffold && scaffold.getAttribute('data-say-on'))
          || 'Two bins now. The close panels are back in the tray.'
        : (scaffold && scaffold.getAttribute('data-say-off'))
          || 'Three bins again. The close panels are back in the tray so you can split them.');
    }

    /* ------------------------------------------------------------- wiring   */

    items.forEach(function (item) {
      item.setAttribute('aria-pressed', 'false');
      item.addEventListener('click', function () { pickUp(item); });
    });

    bins.forEach(function (bin) {
      var labelEl = bin.querySelector('[data-bin-label]');
      var subEl   = bin.querySelector('[data-bin-sub]');
      if (labelEl && !bin.getAttribute('data-label-three')) {
        bin.setAttribute('data-label-three', labelEl.textContent.trim());
      }
      if (subEl && !bin.getAttribute('data-sub-three')) {
        bin.setAttribute('data-sub-three', subEl.textContent.trim());
      }
      bin.addEventListener('click', function () { chooseBin(bin); });
    });

    if (scaffold) {
      scaffold.hidden = false;
      scaffold.setAttribute('aria-pressed', 'false');
      scaffold.addEventListener('click', function () { setScaffold(!twoBins); });
    }

    /* Escape puts a held item back down. Arrow keys walk the tray, so a
       student who has picked an item up does not have to Tab through the
       whole row to reach the bins. Right/Down go forward, Left/Up go back,
       Home and End jump to the ends — the same in every layout. */
    root.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && held) {
        var title = held.getAttribute('data-title');
        var putBack = held;
        drop();
        say(title + '. Put back in the tray.');
        putBack.focus();
        return;
      }
      /* All four arrows, plus Home and End. The tray is three across at
         1024px, two across on a phone and one across inside the licence sort
         — so "the next panel" is to the right on one layout and below it on
         another. Binding left/right only meant the arrow keys silently
         stopped matching what a student could see the moment the tray
         stacked. Both axes walk the same list, in DOM order, which is the
         order the panels are read in. */
      var FORWARD  = { ArrowRight: 1, ArrowDown: 1 };
      var BACKWARD = { ArrowLeft: 1, ArrowUp: 1 };
      var isEdge = event.key === 'Home' || event.key === 'End';
      if (!FORWARD[event.key] && !BACKWARD[event.key] && !isEdge) { return; }
      var row = event.target.closest ? event.target.closest('[data-sort-tray]') : null;
      if (!row) { return; }
      var open = items.filter(function (item) { return !item.hidden; });
      var at = open.indexOf(event.target);
      if (at === -1) { return; }
      event.preventDefault();
      var next;
      if (event.key === 'Home')      { next = 0; }
      else if (event.key === 'End')  { next = open.length - 1; }
      else if (FORWARD[event.key])   { next = at + 1; }
      else                           { next = at - 1; }
      if (next < 0) { next = open.length - 1; }
      if (next >= open.length) { next = 0; }
      open[next].focus();
    });

    countPlaced();
    return { root: root };
  }

  /* ------------------------------------------- the prompts and the choices  */

  /* A row of chips where no answer is wrong. Tapping one gives a line back
     and marks the question answered. The lines live in data-answer. */
  function initPrompts(scope) {
    var groups = all(scope, '[data-prompt]');
    groups.forEach(function (group) {
      var answer = group.querySelector('[data-prompt-answer]');
      var chips  = all(group, '[data-prompt-chip]');
      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', 'false');
        chip.addEventListener('click', function () {
          chips.forEach(function (other) { other.setAttribute('aria-pressed', 'false'); });
          chip.setAttribute('aria-pressed', 'true');
          if (answer) { answer.textContent = chip.getAttribute('data-answer'); }
          group.setAttribute('data-answered', 'true');
          scope.dispatchEvent(new CustomEvent('ff:answered', { bubbles: true }));
        });
      });
    });
  }

  /* ---------------------------------------------------------------- page 3  */

  function init() {
    var board = document.querySelector('[data-sortboard]');
    if (board) { initSortBoard(board); }

    var scramble = document.getElementById('scramble');
    if (scramble) { initPrompts(scramble); }

    /* Step 3 — pick your shot. One tap, and the card answers. */
    var shots = all(document, '[data-shot]');
    var shotAnswer = document.querySelector('[data-shot-answer]');
    var chosen = null;
    shots.forEach(function (shot) {
      shot.setAttribute('aria-pressed', 'false');
      shot.addEventListener('click', function () {
        shots.forEach(function (other) { other.setAttribute('aria-pressed', 'false'); });
        shot.setAttribute('aria-pressed', 'true');
        chosen = shot.getAttribute('data-shot');
        if (shotAnswer) { shotAnswer.textContent = shot.getAttribute('data-answer'); }
        updateCompletion();
      });
    });

    /* The completion strip. It appears only when the whole activity is done:
       six panels placed, three questions answered, one shot chosen. Nothing
       about it is stored — it lasts as long as the page is open. */
    var completion = document.querySelector('[data-completion]');
    var completionLine = document.querySelector('[data-completion-shot]');

    function updateCompletion() {
      if (!completion) { return; }
      var itemsLeft = all(document, '[data-sort-item]').filter(function (item) { return !item.hidden; });
      var answered = all(document, '[data-prompt][data-answered="true"]').length;
      var total = all(document, '[data-prompt]').length;
      if (itemsLeft.length === 0 && answered === total && chosen) {
        if (completionLine) { completionLine.textContent = chosen; }
        completion.hidden = false;
      }
    }

    document.addEventListener('ff:answered', updateCompletion);
    document.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('[data-sort-bin]')) { updateCompletion(); }
    });

    /* Progressive enhancement, the honest way round: the feeling prompts and
       the completion strip ship visible in the HTML, so a student with no
       JavaScript reads the whole activity. JavaScript is what hides them
       until they are earned. */
    all(document, '[data-hide-until-done]').forEach(function (el) { el.hidden = true; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
