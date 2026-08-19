#!/usr/bin/env node
/* Four Frames — regenerate the Panel Scramble story bank.

   Run:  node tools/build-story-bank.js
   Writes: data/story-scenarios/*.json  and  js/story-bank.js

   WHY THIS EXISTS
   ---------------
   The bank used to be 266 hand-written sentences produced from *text labels*
   for the six pictures rather than from the pictures. Frames 1-2 usually
   landed; frames 3-4 drifted into abstraction and stopped describing what was
   actually in the slot — a fishbowl on a bench at sunset was being read as
   "puff parted like a stage curtain, showing the first two scenes in a misty,
   upside-down sky".

   The fix is structural, not editorial. Every sentence below was written while
   looking at the picture it belongs to, and a sentence can only ever appear in
   the slot of the picture it describes. Accuracy is therefore guaranteed by the
   shape of the data: there is no path by which a beat can be attached to a
   picture it is not about. Two wordings per (picture, slot) keep the readings
   from feeling stamped out, chosen deterministically so the same four pictures
   in the same order always give the same story.

   House style, unchanged from the 19 Aug pass: past tense, in the action,
   roughly 10-18 words, named characters, no explaining the joke, no
   art-criticism vocabulary, UK English, and no character dialogue — the comic
   is still and wordless, and so is its reading.

   ponytail: plain node, no dependencies, no build step. The site still ships
   static JS; this only regenerates it. */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];

/* What is literally in each picture — written from the file, not from a label.
   `name` is the character the 19 Aug rewrite established and students see. */
const PICTURES = {
  a: {
    file: 'img/panel-scramble/01-umbrella-artroom.jpg',
    name: 'Brolly',
    inventory: 'A bright yellow umbrella stands open on a big wooden art-room table. ' +
      'A schoolboy with a navy backpack has stopped in the doorway and is looking at it. ' +
      'Sunlight through the windows, green trees outside, jars of brushes, a watercolour ' +
      'palette and a sketchbook in front. Warm afternoon. It is not raining, indoors or out.'
  },
  b: {
    file: 'img/panel-scramble/02-wombat-supermarket.jpg',
    name: 'Womby',
    inventory: 'A clay wombat in a yellow raincoat stands on a red skateboard in a ' +
      'supermarket aisle, looking down at one orange that has rolled onto the floor. ' +
      'Fruit bins of oranges, apples and bananas to the right, shelves of jars to the left, ' +
      'green pendant lamps overhead.'
  },
  c: {
    file: 'img/panel-scramble/03-paper-plane-library.jpg',
    name: 'Pip',
    inventory: 'A huge white paper aeroplane flies between the shelves of a dim library ' +
      'with a lit gold desk lamp riding on its wing. Tall bookcases of colourful books, ' +
      'a stained-glass arched window, a small reading table with a green lamp and two red ' +
      'chairs below, a globe and stacked books. Low-poly, violet, night-ish.'
  },
  d: {
    file: 'img/panel-scramble/04-astronaut-artroom.jpg',
    name: 'Nova',
    inventory: 'A small clay astronaut in a blue suit and helmet sits at a wooden art table ' +
      'holding a paintbrush over a completely blank sheet of paper. A red lunchbox to the ' +
      'left, a jar of brushes and a six-colour palette to the right, a felt noticeboard ' +
      'behind with a rocket, a planet, a star and Earth, and a window of blue sky.'
  },
  e: {
    file: 'img/panel-scramble/05-moon-tram-stop.jpg',
    name: 'Milo',
    inventory: 'A teenager in a yellow raincoat holds a large cratered cardboard moon at a ' +
      'tram stop on a wet street at dusk. A yellow tram is coming up the street, ' +
      'streetlights reflect in the wet road, bare trees and tram wires, deep blue sky, ' +
      'a glass shelter and bench on the left. Photographic.'
  },
  f: {
    file: 'img/panel-scramble/06-cloud-fishbowl.jpg',
    name: 'Puff',
    inventory: 'A glass fishbowl with a small white cloud inside it sits on a wooden bench ' +
      'under a bus-stop shelter. Beyond, the sun is setting over water, pink and orange ' +
      'clouds, a tree on the right, a railing. Nobody is there. Pixel art.'
  }
};

/* Two wordings per (picture, slot). Slot 0 sets up, 1 and 2 build, 3 turns.
   Every sentence has to survive the test: a reader looking at that picture
   should recognise the sentence as being about it. */
const BEATS = {
  a: [
    [
      'A yellow umbrella stood open on the art-room table, and a boy stopped in the doorway.',
      'Sun poured through the art-room windows onto an umbrella somebody had left open on the table.'
    ],
    [
      'In the art room, Brolly was still open on the table, and nobody had touched him.',
      'A boy with a backpack found Brolly open on the art-room table and simply watched.'
    ],
    [
      'Back in the art room, Brolly held the afternoon sun above an empty wooden table.',
      'The boy in the doorway had not moved, and Brolly stayed open in the warm light.'
    ],
    [
      'Brolly sat open on the art-room table with the windows dry and the sun still out.',
      'The last thing anyone saw was a yellow umbrella open indoors, waiting for rain.'
    ]
  ],
  b: [
    [
      'Womby rolled his red skateboard down the supermarket aisle and stopped beside one runaway orange.',
      'In the fruit aisle, a wombat in a yellow raincoat balanced on a skateboard beside an orange.'
    ],
    [
      'Womby coasted past the apple bins in his yellow raincoat and braked hard for a loose orange.',
      'In the supermarket, Womby stood on his skateboard and looked down at the orange by his wheels.'
    ],
    [
      'Womby still had not picked the orange up; it sat on the floor between him and the bananas.',
      'The supermarket lamps glowed, and Womby leaned over his skateboard towards the orange that had escaped.'
    ],
    [
      'Womby looked at the orange, the orange stayed put, and neither of them moved an inch.',
      'So a raincoated wombat on a skateboard ended up nose to nose with a single orange.'
    ]
  ],
  c: [
    [
      'A giant paper aeroplane drifted between the library shelves, carrying a lit desk lamp on its wing.',
      'After closing time the library went dark, and one paper aeroplane came gliding through it.'
    ],
    [
      'Pip sailed past the stained-glass window with the desk lamp still burning on his wing.',
      'In the dark library, Pip glided over the reading table, taking the only light with him.'
    ],
    [
      'Pip was still airborne between the shelves, and the lamp on his wing had not tipped over.',
      'The library stayed quiet while Pip carried his little lamp above the globe and the stacked books.'
    ],
    [
      'Pip flew off between the bookcases with the lamp lit, and the library read by it.',
      'The last light in the library was a desk lamp riding a paper aeroplane past the shelves.'
    ]
  ],
  d: [
    [
      'Nova sat down at the art table, picked up a brush and faced a blank page.',
      'At an ordinary art table, a small astronaut held a paintbrush over a clean sheet of paper.'
    ],
    [
      'Nova held the brush above the paper, with the paints ready and the page still white.',
      'In the art room, Nova kept the brush up and the paper stayed completely empty.'
    ],
    [
      'Nova had not made a mark yet; the palette was full and the sheet was still blank.',
      'Behind Nova the noticeboard rocket waited, and the paper in front of the astronaut stayed white.'
    ],
    [
      'Nova smiled at a blank sheet of paper, brush up, not a single mark made.',
      'The astronaut kept smiling, brush ready, and the paper on the table never got painted.'
    ]
  ],
  e: [
    [
      'Milo waited at the tram stop in a yellow raincoat, holding a cardboard moon.',
      'The rain had stopped, the street shone, and a teenager waited for a tram holding a moon.'
    ],
    [
      'Milo carried his cardboard moon onto the wet platform and watched the yellow tram come closer.',
      'At dusk, Milo gripped the big cratered moon and waited under the streetlights for his tram.'
    ],
    [
      'Milo was still on the wet platform with the moon, and the tram lights were getting closer.',
      'The wet road reflected every streetlight, and Milo kept both hands around the cardboard moon.'
    ],
    [
      'Milo waited at the stop with a moon under his arm, and the tram came anyway.',
      'The sky above the tram stop stayed empty, and the moon waited on the platform with Milo.'
    ]
  ],
  f: [
    [
      'A glass fishbowl sat on the bus-stop bench with a small white cloud floating inside it.',
      'At sunset, somebody had left a fishbowl on the bench, and there was a cloud in it.'
    ],
    [
      'On the bench, Puff turned slowly inside the fishbowl while the sun went down over the water.',
      'The bus stop was empty except for a fishbowl on the bench with a cloud in it.'
    ],
    [
      'Puff was still in the fishbowl on the bench, and the sun was almost down.',
      'Nobody came for the fishbowl, so Puff kept drifting in circles above the wooden bench.'
    ],
    [
      'The sun set over the water, and Puff stayed in the fishbowl on the empty bench.',
      'No bus came, and the last of the light found a cloud sitting in a fishbowl.'
    ]
  ]
};

/* One question per last picture — asked about what is in that picture. */
const QUESTIONS = {
  a: 'Brolly is open indoors and the sun is out. What do you think happened before frame one?',
  b: 'Womby and the orange both stop dead. What do you think happens in the very next second?',
  c: 'Pip takes the library’s only light away with him. Who do you think that light is for?',
  d: 'Nova’s paper is still blank at the end. Is that the problem, or is that the joke?',
  e: 'Milo waits with a moon at a tram stop. Where do you think he is taking it?',
  f: 'The cloud is still in the fishbowl when the sun goes down. Who do you think left it?'
};

const li = function (letter) { return LETTERS.indexOf(letter); };

/* Deterministic wording choice: the same four pictures in the same order always
   give the same reading, and reordering them changes the wording as well as the
   sequence. Nothing random, nothing stored. */
function variant(sequence, slot) {
  var sum = 0;
  for (var i = 0; i < sequence.length; i++) sum += li(sequence[i]) * (i + 1);
  return (sum + slot) % 2;
}

function story(sequence) {
  return {
    key: sequence.join(','),
    sequence: sequence.slice(),
    title: PICTURES[sequence[0]].name + ' and ' + PICTURES[sequence[3]].name,
    beats: sequence.map(function (letter, slot) {
      return BEATS[letter][slot][variant(sequence, slot)];
    }),
    readerQuestion: QUESTIONS[sequence[3]]
  };
}

/* Every ordered selection of four of the six pictures — 6*5*4*3 = 360. */
function permutations() {
  var out = [];
  LETTERS.forEach(function (p1) {
    LETTERS.forEach(function (p2) {
      if (p2 === p1) return;
      LETTERS.forEach(function (p3) {
        if (p3 === p1 || p3 === p2) return;
        LETTERS.forEach(function (p4) {
          if (p4 === p1 || p4 === p2 || p4 === p3) return;
          out.push([p1, p2, p3, p4]);
        });
      });
    });
  });
  return out;
}

const PARTITIONS = [
  { name: 'a-b', file: 'scenarios-a-b.json', first: ['a', 'b'] },
  { name: 'c-d', file: 'scenarios-c-d.json', first: ['c', 'd'] },
  { name: 'e', file: 'scenarios-e.json', first: ['e'] },
  { name: 'f', file: 'scenarios-f.json', first: ['f'] }
];

function main() {
  const all = permutations().map(story);
  if (all.length !== 360) throw new Error('expected 360 stories, built ' + all.length);

  PARTITIONS.forEach(function (part) {
    const stories = all.filter(function (s) { return part.first.indexOf(s.sequence[0]) > -1; });
    const payload = { version: 2, partition: part.name, stories: stories };
    fs.writeFileSync(
      path.join(ROOT, 'data', 'story-scenarios', part.file),
      JSON.stringify(payload, null, 2) + '\n'
    );
    process.stdout.write(part.file + ': ' + stories.length + ' stories\n');
  });

  const bank = {};
  all.forEach(function (s) { bank[s.key] = s; });
  const js =
    '/* Four Frames — authored readings for every ordered four-picture selection.\n' +
    '   Generated from data/story-scenarios/*.json by tools/build-story-bank.js.\n' +
    '   Do not hand-edit: edit the sentences in that script and re-run it.\n' +
    '   Local data only: no request is made. */\n' +
    'window.FOUR_FRAMES_STORY_BANK = ' + JSON.stringify(bank, null, 2) + ';\n';
  fs.writeFileSync(path.join(ROOT, 'js', 'story-bank.js'), js);
  process.stdout.write('js/story-bank.js: ' + Object.keys(bank).length + ' readings\n');
}

main();
