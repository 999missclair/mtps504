/* ==========================================================================
   FOUR FRAMES — the roll
   Wires the dice mount on roll.html. Deck, deal rules and the one-re-roll
   ruling all come from dice-roll-options.md; the deck below is that file's
   "Data shape for the build" block, lifted unchanged.

   Rules this file keeps, and they are claims made in the video rationale:
   - No storage of any kind. No localStorage, no sessionStorage, no cookie.
     Refresh the page and the roll is gone. That is the design, not a bug:
     the class board is the memory, and the page says so in the sidebar.
   - No network requests. Nothing is fetched, nothing is sent. The card
     pictures are inline SVG placeholders until Clair drops the real
     thumbnails in — see the SWAP comment written into every card.
   - Deal WITHOUT replacement inside a column. Two identical cards is no
     choice at all, and at one in twelve it would happen in a class of 26.
   - One re-roll per session, not per column. It re-deals all three columns,
     clears every selection, and announces the new six.
   - Every card is a real <button> with aria-pressed, so the keyboard does
     exactly the same task as the mouse. Selected state is three signals:
     Sun fill, a tick, and aria-pressed="true" — never colour alone.

   Markup contract (see roll.html)
     [data-dice]              the panel root
     [data-dice-col="character|situation|problem"]
     [data-dice-slots]        the <ul> that holds the two cards
     [data-dice-roll]         the ROLL / RE-ROLL (1 left) button
     [data-dice-reroll-note]  the line explaining the one re-roll
     [data-dice-rolled]       "That's your roll." — shown once it is spent
     [data-dice-lock]         Lock it in, disabled until three are chosen
     [data-dice-brief]        the brief strip, hidden until locked
     [data-dice-brief-text]   the exact copy string goes in here
     [data-dice-copy]         Copy my brief
     [data-dice-live]         aria-live="polite"
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------- the deck, V3 only ---
     dice-roll-options.md § "Data shape for the build". V1 and V2 are read
     aloud in class and are deliberately not on the site. `thumb` names the
     verified candidate image for each card; `alt` gets written when the
     pictures are downloaded, which is why the placeholders carry the search
     term instead. */

  var DECK = {
    deck: 'v3-out-of-the-art-room',
    dealPerField: 2,
    reRollsAllowed: 1,
    verified: '2026-08-09',
    character: [
      { id: 'c1',  label: 'A Greek marble statue',               searchTerm: 'greek marble statue bust',    thumb: 'Met 247173 — Marble statue of Eirene, ca. 14–68 CE (public domain)' },
      { id: 'c2',  label: 'A portrait subject, tired of posing',  searchTerm: 'oil portrait painting seated', thumb: 'Commons — Oil study of an old man with a red hat, Rembrandt, c. 1654' },
      { id: 'c3',  label: 'A suit of armour',                    searchTerm: 'suit of armor knight',        thumb: 'Met 35935 — Armor, ca. 1535 (public domain)' },
      { id: 'c4',  label: 'An Egyptian cat sculpture',           searchTerm: 'egyptian cat bronze bastet',  thumb: 'Commons — Statuette of the goddess Bastet, bronze, Museo Egizio Turin C 268 p02' },
      { id: 'c5',  label: 'A Japanese woodblock wave',           searchTerm: 'hokusai great wave woodblock', thumb: 'Met 39799 — Under the Wave off Kanagawa, ca. 1830–32 (public domain)' },
      { id: 'c6',  label: 'A lemon from a Dutch still life',     searchTerm: 'dutch still life lemon',      thumb: 'Commons — Jan Davidsz. de Heem, Still-Life with a Peeled Lemon (WGA11270)' },
      { id: 'c7',  label: 'A ceramic teapot',                    searchTerm: 'ceramic teapot porcelain',    thumb: 'Met 20144 — Teapot, ca. 1897–1900 (public domain)' },
      { id: 'c8',  label: 'A gallery attendant',                 searchTerm: 'museum attendant',            thumb: 'Openverse — "Museum attendant" (Flickr)' },
      { id: 'c9',  label: 'A stuffed bird in a case',            searchTerm: 'taxidermy bird glass case',   thumb: 'Commons — Display case with taxidermied birds, Natural History Museum, London' },
      { id: 'c10', label: 'A grand piano',                       searchTerm: 'grand piano concert',         thumb: 'Commons — Steinway & Sons concert grand piano, model D-274, Hamburg' },
      { id: 'c11', label: 'A stained-glass angel',               searchTerm: 'stained glass window angel',  thumb: 'Commons — Stained glass window with angels, Saint Antony church, St. Ulrich in Gröden' },
      { id: 'c12', label: 'A dinosaur skeleton',                 searchTerm: 'dinosaur skeleton museum hall', thumb: 'Commons — Stegosaurus skeleton at American Museum of Natural History' }
    ],
    situation: [
      { id: 's1',  label: 'The museum has just closed',           searchTerm: 'museum gallery interior empty', thumb: 'Commons — Burrell Collection Interior 1 2022' },
      { id: 's2',  label: 'A school excursion arrives',           searchTerm: 'school children museum visit',  thumb: 'Commons — School group visit' },
      { id: 's3',  label: 'The gallery is being repainted',       searchTerm: 'painting a wall with roller',   thumb: 'Commons — Paint roller 4' },
      { id: 's4',  label: 'The fire alarm is being tested',       searchTerm: 'fire alarm bell',               thumb: 'Commons — Fire Alarm Bell red / Fire alarm bell guardall' },
      { id: 's5',  label: 'Being packed into a crate',            searchTerm: 'wooden packing crate',          thumb: 'Commons — Wooden packing crates for the transport of fruit and vegetables (geograph 557258, CC BY-SA)' },
      { id: 's6',  label: 'The cleaner has arrived, with a very large duster', searchTerm: 'feather duster cleaning', thumb: 'Commons — Ostrich Feather Duster cropped' },
      { id: 's7',  label: 'The lights go out',                    searchTerm: 'museum gallery dark',           thumb: 'Commons — Museum After Dark (14405871648)' },
      { id: 's8',  label: 'A very slow tour group',               searchTerm: 'museum tour guide group',       thumb: 'Commons — Benton Museum of Art tour group' },
      { id: 's9',  label: 'Being photographed for the catalogue', searchTerm: 'camera tripod studio',          thumb: 'Commons — (Photography equipment Tripod Photo Camera Tripod photograph in a studio)' },
      { id: 's10', label: 'A child has escaped the tour',         searchTerm: 'child running museum',          thumb: 'Openverse — "Run" (Georgie Pauwels, CC BY 2.0)' },
      { id: 's11', label: 'An empty plinth appears next door',    searchTerm: 'empty pedestal statue',         thumb: 'Commons — Morse empty pedestal jeh (NOT the Colston plinth)' },
      { id: 's12', label: 'Someone left a window open',           searchTerm: 'open window curtain light',     thumb: 'Openverse — "Window & Curtains" (CC BY)' }
    ],
    problem: [
      { id: 'p1',  label: 'They’ve been put back upside down',         glyph: 'flip' },
      { id: 'p2',  label: 'They no longer fit where they’re kept',     glyph: 'box' },
      { id: 'p3',  label: 'Someone has touched them',                       glyph: 'hand' },
      { id: 'p4',  label: 'They can only be seen from one angle',           glyph: 'eye' },
      { id: 'p5',  label: 'Their colours are fading',                       glyph: 'gradient' },
      { id: 'p6',  label: 'A copy appears across the room',                 glyph: 'double' },
      { id: 'p7',  label: 'They’ve fallen for the sculpture opposite', glyph: 'heart' },
      { id: 'p8',  label: 'The description card is a lie',                  glyph: 'label' },
      { id: 'p9',  label: 'They keep turning up in strangers’ photos', glyph: 'camera' },
      { id: 'p10', label: 'They’ve been moved to storage',             glyph: 'crate' },
      { id: 'p11', label: 'A crack has appeared, and it’s spreading',  glyph: 'crack' },
      { id: 'p12', label: 'They are the only one left in the room',         glyph: 'empty-room' }
    ]
  };

  var FIELDS = ['character', 'situation', 'problem'];

  /* What the live region calls each column, in a sentence. */
  var FIELD_WORD = {
    character: 'character',
    situation: 'situation',
    problem: 'problem'
  };

  /* ------------------------------------------------------------ glyphs ---
     One small line drawing per problem, drawn in Ink via currentColor. Not
     emoji, not a photograph: a problem is an event, and photographing it
     kills the joke before the student has told it (design spec 5.3). */

  var GLYPHS = {
    flip:         '<path d="M8 16h32M24 6v8M24 34v8"/><path d="M14 16l10-10 10 10"/><path d="M34 32l-10 10-10-10"/>',
    box:          '<rect x="6" y="16" width="24" height="22"/><path d="M30 22h12v16H30"/><path d="M6 16l6-6h24l-6 6"/>',
    hand:         '<path d="M18 40V20a3 3 0 016 0v-6a3 3 0 016 0v6a3 3 0 016 0v14a8 8 0 01-8 8z"/><path d="M18 26l-6 4 4 10"/>',
    eye:          '<path d="M4 24s8-12 20-12 20 12 20 12-8 12-20 12S4 24 4 24z"/><circle cx="24" cy="24" r="6"/>',
    gradient:     '<rect x="6" y="8" width="36" height="32"/><path d="M12 14h24M12 20h24M14 26h20M18 32h12"/>',
    double:       '<rect x="6" y="10" width="18" height="28"/><rect x="26" y="10" width="18" height="28" stroke-dasharray="4 4"/>',
    heart:        '<path d="M24 40S6 29 6 18a9 9 0 0118-4 9 9 0 0118 4c0 11-18 22-18 22z"/>',
    label:        '<rect x="6" y="12" width="36" height="24"/><path d="M12 20h16M12 26h22"/><path d="M32 16l10 16"/>',
    camera:       '<rect x="6" y="14" width="36" height="24"/><path d="M18 14l4-6h8l4 6"/><circle cx="24" cy="26" r="7"/>',
    crate:        '<rect x="6" y="10" width="36" height="28"/><path d="M6 10l36 28M42 10L6 38"/><path d="M6 18h36M6 30h36"/>',
    crack:        '<rect x="8" y="8" width="32" height="32"/><path d="M24 8l-5 12 8 6-6 14"/>',
    'empty-room': '<path d="M4 34h40"/><path d="M4 34l12-14h16l12 14"/><rect x="20" y="24" width="8" height="10" stroke-dasharray="3 3"/>'
  };

  function glyphSvg(name) {
    var body = GLYPHS[name] || GLYPHS.label;
    return '<svg class="dice-card__glyph" viewBox="0 0 48 48" aria-hidden="true" focusable="false" ' +
           'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" ' +
           'stroke-linejoin="round">' + body + '</svg>';
  }

  /* Real thumbnails, downloaded and verified for the class image bank
     (data/image-bank.csv), 400px on the long edge, in img/dice/. One entry
     per card that has a qualifying image — c8 "A gallery attendant" has
     none (documented in data/README.md: every open-licence candidate found
     failed the classroom-appropriateness or legibility screen), so it
     keeps the drawn placeholder below rather than shipping a bad photo. */
  var THUMBS = {
    c1:  { file: 'c1.jpg',  alt: 'A tall, headless and armless marble statue of a draped standing woman in flowing robes — the Greek personification of Peace.' },
    c2:  { file: 'c2.jpg',  alt: 'An old man with a long grey beard and a bright red cap stands leaning wearily on a walking stick, wrapped in a heavy robe.' },
    c3:  { file: 'c3.jpg',  alt: 'A complete polished steel suit of armour standing upright, with a closed visored helmet, plate gauntlets and articulated leg guards.' },
    c4:  { file: 'c4.jpg',  alt: 'A sleek bronze statue of a seated cat with pierced ears and a gold nose ring, sitting alert and upright on a pedestal.' },
    c5:  { file: 'c5.jpg',  alt: 'A giant cresting blue wave with clawing white foam towers over small boats, with snow-capped Mount Fuji visible small in the background.' },
    c6:  { file: 'c6.jpg',  alt: 'A richly painted table scene with grapes, an oyster shell and a bright yellow lemon peeled in one long curling spiral, draped over the table’s edge.' },
    c7:  { file: 'c7.jpg',  alt: 'A rounded green-and-white porcelain teapot painted with two colourful exotic birds in an oval panel, gilded trim, and a flower-bud lid handle — a classic 18th-century English tea set piece.' },
    c9:  { file: 'c9.jpg',  alt: 'A fluffy young tawny owl, taxidermied and perched on a mossy branch stump, displayed close-up inside a small clear plastic museum case.' },
    c10: { file: 'c10.png', alt: 'A gleaming black Steinway concert grand piano shown on a plain white background, lid raised, showing its full curved body and gold-lettered maker’s name.' },
    c11: { file: 'c11.jpg', alt: 'A tall stained-glass church window showing two winged angels in blue and pink robes holding a large wooden cross, framed by cherubs and coloured glass patterns.' },
    c12: { file: 'c12.jpg', alt: 'A full Stegosaurus skeleton with its distinctive back plates and spiked tail, mounted beside a smaller juvenile skeleton in a museum dinosaur hall.' },
    s1:  { file: 's1.jpg',  alt: 'A long, empty museum corridor seen through a stone archway, with light streaming across the polished floor and no visitors in sight.' },
    s2:  { file: 's2.jpg',  alt: 'A small group of young school children in a semicircle listening to a museum educator in a pink cardigan, who is holding up an animal skull in front of a taxidermy display.' },
    s3:  { file: 's3.jpg',  alt: 'A paint roller on a long handle resting against a brick wall that is half freshly painted orange and half still bare brick, next to a metal paint tin.' },
    s4:  { file: 's4.jpg',  alt: 'A round red fire alarm bell mounted on a wooden wall panel in a stairwell, photographed straight-on so the alarm bell brand label is readable.' },
    s5:  { file: 's5.jpg',  alt: 'A tall stack of large wooden slatted packing crates, photographed outdoors against trees and sky.' },
    s6:  { file: 's6.jpg',  alt: 'A large, fluffy grey-and-white ostrich-feather duster on a long wooden handle, shown close up against a plain white background.' },
    s7:  { file: 's7.jpg',  alt: 'A dim, almost-dark corridor with a stone column and staircase, only two ceiling lamps glowing.' },
    s8:  { file: 's8.jpg',  alt: 'A museum guide gestures while speaking to a cluster of visitors standing in front of framed artworks on a pale blue gallery wall.' },
    s9:  { file: 's9.jpg',  alt: 'An empty photography studio: two bright softbox lights face a white paper backdrop laid out on the floor, ready for a subject to be photographed.' },
    s10: { file: 's10.jpg', alt: 'Black-and-white photo of a young girl mid-run down a museum staircase and gallery, arms swinging, captured in motion blur, with a skylight glowing above.' },
    s11: { file: 's11.jpg', alt: 'A stone pedestal in a park reading MORSE, with a green sign explaining the statue has been temporarily removed for conservation.' },
    s12: { file: 's12.jpg', alt: 'Sheer cream curtains hang in front of a sunlit window, framed by heavier dark drapes pulled to each side.' }
  };

  /* The thumbnail for CHARACTER and SITUATION cards: a real photo where
     data/image-bank.csv has a verified one (THUMBS above), a drawn
     placeholder for the one card that doesn't (c8). The placeholder is a
     framed picture shape, 96px tall in the CSS, with the search term
     underneath as the caption, so the card still reads as complete. */
  function thumbPlaceholder(card) {
    var thumb = THUMBS[card.id];
    if (thumb) {
      return '<img class="dice-card__thumb" src="img/dice/' + thumb.file + '" ' +
             'alt="' + esc(thumb.alt) + '" loading="lazy" width="120" height="72">';
    }
    return '<span class="dice-card__thumb" aria-hidden="true">' +
             '<svg viewBox="0 0 120 72" focusable="false" fill="none" stroke="currentColor" ' +
             'stroke-width="3" stroke-linejoin="round">' +
               '<rect x="2" y="2" width="116" height="68"/>' +
               '<path d="M2 54l30-24 22 18 16-12 46 26"/>' +
               '<circle cx="88" cy="22" r="8"/>' +
             '</svg>' +
           '</span>' +
           '<!-- SWAP: no verified image bank candidate exists for this card' +
           '     (see data/README.md, "what was rejected and why") —' +
           '     if one is added later, follow the pattern above. ' +
           '     Verified candidate: ' + card.thumb.replace(/--/g, '—') + ' -->';
  }

  /* --------------------------------------------------------- utilities ---- */

  function esc(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Two DISTINCT cards from a twelve-card column. Partial Fisher-Yates over
     a copy of the array: draw one, swap it out of range, draw the next from
     what is left. Without replacement by construction, so there is no retry
     loop that could in principle spin. */
  function dealFrom(pool, count) {
    var copy = pool.slice();
    var out = [];
    for (var i = 0; i < count && copy.length; i++) {
      var pick = Math.floor(Math.random() * copy.length);
      out.push(copy[pick]);
      copy[pick] = copy[copy.length - 1];
      copy.pop();
    }
    return out;
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ------------------------------------------------------------- board ---- */

  function initDice(root) {
    var cols = {};
    FIELDS.forEach(function (field) {
      var el = root.querySelector('[data-dice-col="' + field + '"]');
      cols[field] = el ? el.querySelector('[data-dice-slots]') : null;
    });
    if (!cols.character || !cols.situation || !cols.problem) { return; }

    var rollBtn    = root.querySelector('[data-dice-roll]');
    var rerollNote = root.querySelector('[data-dice-reroll-note]');
    var rolledLine = root.querySelector('[data-dice-rolled]');
    var live       = root.querySelector('[data-dice-live]');

    /* Lock, brief strip and Copy sit in the next section, not inside the
       dice panel, so look for them across the whole page. */
    var lockBtn   = document.querySelector('[data-dice-lock]');
    var briefBox  = document.querySelector('[data-dice-brief]');
    var briefText = document.querySelector('[data-dice-brief-text]');
    var copyBtn   = document.querySelector('[data-dice-copy]');

    var rollsUsed = 0;                                   /* 0, 1, then spent */
    var chosen    = { character: null, situation: null, problem: null };
    var dealt     = { character: [],   situation: [],   problem: [] };

    function say(message) {
      if (!live) { return; }
      live.textContent = '';
      /* A repeat of the same string is not re-announced by some screen
         readers unless the region actually changes, hence the reset. */
      window.setTimeout(function () { live.textContent = message; }, 40);
    }

    function chosenCount() {
      return FIELDS.filter(function (f) { return chosen[f]; }).length;
    }

    function updateLock() {
      if (!lockBtn) { return; }
      lockBtn.disabled = chosenCount() < 3;
    }

    /* ------------------------------------------------------ drawing a card */

    function cardMarkup(field, card, index) {
      var isProblem = field === 'problem';
      var inner = isProblem
        ? glyphSvg(card.glyph) +
          '<span class="dice-card__label">' + esc(card.label) + '</span>'
        : thumbPlaceholder(card) +
          '<span class="dice-card__label">' + esc(card.label) + '</span>' +
          '<span class="dice-card__term">Picture to find: ' + esc(card.searchTerm) + '</span>';

      return '<li class="dice__filled" style="--deal-step:' + index + '">' +
               '<button type="button" class="dice-card' + (isProblem ? ' dice-card--problem' : '') + '" ' +
                 'data-dice-card data-field="' + field + '" data-id="' + card.id + '" ' +
                 'aria-pressed="false">' + inner +
               '</button>' +
             '</li>';
    }

    function render(reduced) {
      var step = 0;
      FIELDS.forEach(function (field) {
        var html = '';
        dealt[field].forEach(function (card) {
          html += cardMarkup(field, card, step);
          step++;
        });
        cols[field].innerHTML = html;
      });
      if (!reduced) {
        Array.prototype.forEach.call(root.querySelectorAll('.dice__filled'), function (li) {
          li.classList.add('is-dealing');
        });
      }
    }

    /* ------------------------------------------------------------ the deal */

    function roll() {
      if (rollsUsed >= 1 + DECK.reRollsAllowed) { return; }

      FIELDS.forEach(function (field) {
        dealt[field] = dealFrom(DECK[field], DECK.dealPerField);
        chosen[field] = null;
      });

      var reduced = prefersReducedMotion();
      render(reduced);
      updateLock();

      if (briefBox) { briefBox.hidden = true; }

      rollsUsed++;

      if (rollsUsed === 1) {
        rollBtn.textContent = 'Re-roll (1 left)';
        if (rerollNote) { rerollNote.hidden = false; }
      } else {
        /* The one re-roll is spent. The button goes, and the quiet line
           takes over so the emphasis moves to Lock it in. */
        rollBtn.hidden = true;
        if (rerollNote) { rerollNote.hidden = true; }
        if (rolledLine) { rolledLine.hidden = false; }
      }

      /* The announcement used to read all six card labels out — 47 words
         before the student could do anything with it, and a screen-reader
         user cannot interrupt a polite region to get on with the task. It now
         says what happened and how many, and focus moves to the first dealt
         card so the reader speaks that card's own label next. The six labels
         are still spoken; they are spoken one at a time, in the student's own
         time, as they Tab across the columns. */
      say('Rolled. Six cards dealt, two in each column. Pick one from each.');

      /* Moving focus also fixes a real keyboard bug: the ROLL button is below
         the columns, and on the second roll it hides itself, which used to
         drop focus back to the top of the document with nothing announced. */
      var firstCard = root.querySelector('[data-dice-card]');
      if (firstCard) { firstCard.focus(); }
    }

    /* --------------------------------------------------------- selecting  */

    function select(button) {
      var field = button.getAttribute('data-field');
      var id    = button.getAttribute('data-id');
      var card  = dealt[field].filter(function (c) { return c.id === id; })[0];
      if (!card) { return; }

      var wasChosen = chosen[field] && chosen[field].id === id;

      Array.prototype.forEach.call(
        root.querySelectorAll('[data-dice-card][data-field="' + field + '"]'),
        function (b) { b.setAttribute('aria-pressed', 'false'); }
      );

      if (wasChosen) {
        chosen[field] = null;
        say('Cleared your ' + FIELD_WORD[field] + '. ' + remaining());
      } else {
        chosen[field] = card;
        button.setAttribute('aria-pressed', 'true');
        say(card.label + ' chosen as your ' + FIELD_WORD[field] + '. ' + remaining());
      }

      if (briefBox) { briefBox.hidden = true; }
      updateLock();
    }

    function remaining() {
      var left = 3 - chosenCount();
      if (left === 0) { return 'All three picked. You can lock it in.'; }
      if (left === 1) { return 'One column to go.'; }
      return left + ' columns to go.';
    }

    /* ------------------------------------------------------- lock and copy */

    function briefString() {
      return FIELDS.map(function (f) { return chosen[f] ? chosen[f].label : ''; }).join(' · ');
    }

    function lock() {
      if (chosenCount() < 3 || !briefBox || !briefText) { return; }
      briefText.textContent = briefString();
      briefBox.hidden = false;
      say('Locked in. ' + briefString() + '. Copy it, then put it on the board.');
      /* Move the eye and the reading order to the thing that just appeared. */
      if (copyBtn) { copyBtn.focus(); }
    }

    /* Clipboard first, and a select-the-text fallback for the school build,
       where the Clipboard API is not available outside a secure context. */
    function copyBrief() {
      var text = briefText ? briefText.textContent : '';
      if (!text) { return; }

      function done() { say('Copied.'); }

      function fallback() {
        var range = document.createRange();
        range.selectNodeContents(briefText);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        if (ok) {
          done();
        } else {
          say('Your brief is selected. Press Control and C, or Command and C, to copy it.');
        }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    }

    /* ------------------------------------------------------------- wiring */

    rollBtn.addEventListener('click', roll);

    root.addEventListener('click', function (event) {
      var button = event.target.closest ? event.target.closest('[data-dice-card]') : null;
      if (button && root.contains(button)) { select(button); }
    });

    if (lockBtn) { lockBtn.addEventListener('click', lock); }
    if (copyBtn) { copyBtn.addEventListener('click', copyBrief); }

    updateLock();
  }

  function start() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-dice]'), initDice);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  /* Exposed for the headless test only. Nothing on the page reads this. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DECK: DECK, dealFrom: dealFrom };
  }
})();
