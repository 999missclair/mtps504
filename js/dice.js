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
     [data-dice-brief-spark]  optional: the story-pitch sentence (display only)
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
      { id: 'c1',  label: 'A frolicking rabbit',                    searchTerm: 'choju jinbutsu giga frolicking animals scroll', thumb: 'Commons \u2014 Ch\u014dj\u016b-jinbutsu-giga, first scroll: rabbit and fox beside the archery target (CC0)' },
      { id: 'c2',  label: 'A rabbit with a sword, from the edge of a page', searchTerm: 'medieval marginalia hare crossbow', thumb: 'Bodleian MS. Bodl. 264 \u2014 The Romance of Alexander, folio 81v: hares hunting the hunter (public domain)' },
      { id: 'c3',  label: 'A suit of armour',                       searchTerm: 'suit of armor knight',        thumb: 'Met 35935 \u2014 Armor, ca. 1535 (public domain)' },
      { id: 'c4',  label: 'A cat-headed goddess',                   searchTerm: 'bastet cat headed bronze statuette', thumb: 'Met 558306 \u2014 Statuette of cat-headed Bastet, 664\u201330 BCE (public domain)' },
      { id: 'c5',  label: 'A very well-dressed cat',                searchTerm: 'louis wain cat',              thumb: 'Commons \u2014 The Playwright, Louis Wain, 1902 (public domain)' },
      { id: 'c6',  label: 'An animal in a frock coat',              searchTerm: 'grandville metamorphoses du jour', thumb: 'Met 821366 \u2014 Mister Vulture, J. J. Grandville, 1840 (public domain)' },
      { id: 'c7',  label: 'A ceramic teapot',                       searchTerm: 'ceramic teapot porcelain',    thumb: 'Met 20144 \u2014 Teapot, ca. 1897\u20131900 (public domain)' },
      { id: 'c8',  label: 'A cat behaving like a person',           searchTerm: 'kuniyoshi cat kimono print',  thumb: 'Commons \u2014 A cat dressed as a woman tapping the head of an octopus, Utagawa Kuniyoshi, ca. 1847 (public domain)' },
      { id: 'c9',  label: 'A fox in a gentleman\u2019s coat',          searchTerm: 'kaulbach reineke fuchs fox',  thumb: 'Commons \u2014 Reineke Fuchs plate 3.1, Wilhelm von Kaulbach, 1846 (public domain)' },
      { id: 'c10', label: 'A stone gargoyle',                       searchTerm: 'notre dame chimera gargoyle', thumb: 'Commons \u2014 Bored Gargoyle of Notre Dame, Julian Fong, 2010 (CC BY-SA 2.0)' },
      { id: 'c11', label: 'A monkey dressed as a painter',          searchTerm: 'singe peintre monkey painter', thumb: 'Commons \u2014 Le Singe peintre, Chardin, ca. 1739\u201340, Mus\u00e9e du Louvre (public domain)' },
      { id: 'c12', label: 'A dinosaur skeleton',                    searchTerm: 'dinosaur skeleton museum hall', thumb: 'Commons \u2014 Stegosaurus skeleton at American Museum of Natural History (CC BY 4.0)' }
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
     per card, and as of the anthropomorphic rebuild there are 24 of 24 —
     the old c8 "A gallery attendant" had no qualifying open-licence image
     and shipped a drawn placeholder. That card is gone; c8 is now "A cat
     behaving like a person" and carries a real Kuniyoshi print, so nothing
     on the roll page renders a placeholder any more. The fallback below is
     kept because a future card could lose its image, not because one has. */
  var THUMBS = {
    c1:  { file: 'c1.jpg',  alt: 'A loose ink drawing of a rabbit sitting up on its haunches beside a fox standing on two legs holding an arrow, next to a round archery target hung between bamboo poles.' },
    c2:  { file: 'c2.jpg',  alt: 'The painted lower margin of a medieval manuscript page, where an upright hare aims a drawn crossbow along the border at a small seated rabbit.' },
    c3:  { file: 'c3.jpg',  alt: 'A complete polished steel suit of armour standing upright, with a closed visored helmet, plate gauntlets and articulated leg guards.' },
    c4:  { file: 'c4.jpg',  alt: 'A small green bronze goddess with a cat\u2019s head and pricked ears, standing in a long close-fitting dress, raising a rattle in one hand and holding a basket in the other.' },
    c5:  { file: 'c5.png',  alt: 'A pen-and-ink drawing of a wide-eyed cat wearing a monocle and a neck ribbon, sitting upright at a desk with a quill pen gripped in one paw over an open notebook.' },
    c6:  { file: 'c6.jpg',  alt: 'A pen drawing of a vulture-headed gentleman in a battered top hat and heavy overcoat, standing hunched with a walking cane.' },
    c7:  { file: 'c7.jpg',  alt: 'A rounded green-and-white porcelain teapot painted with two colourful exotic birds in an oval panel, gilded trim, and a flower-bud lid handle \u2014 a classic 18th-century English tea set piece.' },
    c8:  { file: 'c8.jpg',  alt: 'A cat standing upright in a patterned red and blue kimono holds a ladle and taps the head of a large orange octopus, with columns of Japanese text behind.' },
    c9:  { file: 'c9.jpg',  alt: 'A fox in a white ruffed shirt sits reading an open book on a stand while a bear in a scarf bows and doffs its top hat, watched by a vixen at a cottage window.' },
    c10: { file: 'c10.jpg', alt: 'A winged stone creature slumps with its face in its hands on a cathedral balustrade, with more carved figures behind it and the rooftops of Paris below.' },
    c11: { file: 'c11.jpg', alt: 'A monkey in a red coat and feathered tricorn hat sits at an easel holding a brush, painting from a small white statue on a table.' },
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
     placeholder for any card that doesn't (currently none). The placeholder is a
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

  /* Lower the first letter so a label reads mid-sentence: "A well-dressed cat"
     becomes "a well-dressed cat" after "Meet ". Leaves the rest untouched, so
     "They've" only loses its capital T, never its apostrophe. */
  function lowerFirst(text) {
    text = String(text);
    return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
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
    var lockBtn    = document.querySelector('[data-dice-lock]');
    var briefBox   = document.querySelector('[data-dice-brief]');
    var briefText  = document.querySelector('[data-dice-brief-text]');
    var briefSpark = document.querySelector('[data-dice-brief-spark]');
    var copyBtn    = document.querySelector('[data-dice-copy]');

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
      say('Rolled. Six cards on the table, two in each column. Pick the funniest one from each.');

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

    /* The three cards, stitched into a one-line story pitch with comic timing:
       character, then the scene, then the thing that goes wrong. It is the
       payoff of the roll — three fragments become a strip a Year 8 can already
       picture — and it reads aloud cleanly on the live region too. Display and
       announcement only: the copyable brief stays the plain "A · B · C" string
       the board, the planner and the slide title all expect. */
    function sparkString() {
      var c = chosen.character ? lowerFirst(chosen.character.label) : '';
      var s = chosen.situation ? chosen.situation.label : '';
      var p = chosen.problem ? lowerFirst(chosen.problem.label) : '';
      return 'Meet ' + c + '. ' + s + '. And then — ' + p + '. Four frames, no words. Go.';
    }

    /* Save the locked brief so it follows the student to Plan, Build and the
       Comic Builder (read by js/brief.js). Device-only localStorage — no
       account, no cookie — consistent with the site's privacy stance. */
    function saveBrief() {
      try {
        localStorage.setItem('ff-brief', JSON.stringify({
          character: chosen.character ? chosen.character.label : '',
          situation: chosen.situation ? chosen.situation.label : '',
          problem: chosen.problem ? chosen.problem.label : '',
          text: briefString(),
          /* Additive: the story-pitch line, for any page that wants the funnier
             framing. The banner reads `text`, so this never affects it. */
          spark: sparkString()
        }));
      } catch (e) {}
    }

    function lock() {
      if (chosenCount() < 3 || !briefBox || !briefText) { return; }
      briefText.textContent = briefString();
      if (briefSpark) { briefSpark.textContent = sparkString(); }
      briefBox.hidden = false;
      saveBrief();
      say('Locked in. ' + sparkString() + ' Copy your brief, then put it on the board.');
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
