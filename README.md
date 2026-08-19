# FOUR FRAMES

Year 8 Visual Arts creative-technologies site — MTPS504 Assignment 2.

Students build a four-frame cartoon strip from openly licensed images: composition,
cartoon comedy structure, and creative limitation as a generative device (the dice roll).

**The design document is the source of truth**, not this README and not the mockup:

```
Master of Teaching - Visual Arts/Clair Assignment System/assignments/planned/
  mtps504-a2/working/site-map-and-design.md
```

`mockup/index.html` is a palette-and-chrome reference only. Its Build page still shows
the **cancelled** drag-and-arrange studio. Build page 6 from §4.4 of the design doc.

---

## Status

| | |
|---|---|
| Deployed | **Yes.** [Four-Frame Comic Creator](https://four-frame-comic-creator.vercel.app) is live on Vercel. |
| Pushed | **Yes.** `main` is on GitHub; use `git log -1 --oneline` for the current revision. |
| Deploy command | `npx vercel --prod --yes` |
| ⚠️ **In sync?** | **No, as at 19 Aug 2026.** The live build is **one commit behind** local `main` — the homepage still carries the "Why four frames?" beats block that `3ce1b46` removed. **Redeploy before recording the video rationale**, or the run-sheet will not match what is on screen. |

The production project has teacher-owned `OPENROUTER_API_KEY`, `GIPHY_API_KEY` and
`CLASS_PASSWORD` environment variables. Change them only in Vercel, then redeploy.

### Final submission Padlet — teacher setup still required

`2 Roll` keeps the existing **Roll Call** Padlet for early idea sharing. Before the
final lesson, create a separate **Final submission Padlet** and add its two URLs to
the empty `data-final-padlet-embed` and `data-final-padlet-link` attributes in
`share.html`. Do not reuse Roll Call for final submissions. The Share-page Padlet
stays locked until the Comic Builder has recorded a successful download on that
device; it then displays the configured final board.

---

## Stack

Plain static HTML + one stylesheet. **No build step, no framework, no package.json,
no dependencies.** Open a file and it works.

Three rules the site keeps, because each one is a claim made in the video rationale
and each has to be true in the code:

1. **No third-party libraries, CDNs, remote fonts or analytics.** Type is two system
   stacks. The optional class-approved GIF and AI helpers call the site's own `/api` routes,
   which hold the keys server-side. **Note the nuance for the video rationale:** the site does
   embed a `youtube-nocookie` player on `2 Roll` and two Padlet boards (`2 Roll`, `5 Share`), and
   `3 Plan` links out to Khan Academy. The claim to make on camera is "no third-party *libraries*,
   trackers or analytics" — **not** "no external requests of any kind", which is no longer true.
2. **Device-only drafts.** No account or cookies. The locked roll and comic-in-progress use
   browser storage on this device so students can move between pages; they are not durable work.
   The older "nothing is saved anywhere" phrasing is **wrong** and must not be reused in the
   written plan or the video — use the device-only wording (`CODEX-FIXES.md` 5.6).
3. **No `outline: none`.** Focus is a two-tone ring (Sun inner + Ink outer) so it
   reads on both the dark bar and the light page.

---

## Pages

**Eleven pages**, all at the repo root. Every page carries the full template.

| File | Nav label | WA sub-strand | State |
|---|---|---|---|
| `index.html` | HOME | — | **Built** |
| `brief.html` | BRIEF | Project overview | **Built** |
| `look.html` | 1 LOOK | Investigating & defining | **Built** |
| `roll.html` | 2 ROLL | Designing | **Built** |
| `plan.html` | 3 PLAN | Designing | **Built** |
| `build.html` | 4 BUILD | Producing & implementing | **Built** |
| `share.html` | 5 SHARE | Evaluating | **Built** |
| `help.html` | HELP | — | **Built** |
| `canvas.html` | (from Build) | Producing & implementing | **Built** — the Comic Builder; activity 3 |
| `bank.html` | (from Build) | Producing & implementing | **Built** — the curated class image bank |
| `safety.html` | (from Help) | — | **Built** — linked from Help, full bottom nav |

`css/site.css` is the whole design system. It is sectioned and commented; read the
section map at the top before adding anything.

## Scripts

**Fourteen** small files, no dependencies, all deferred, none of them required for the page
to read. Each carries its markup contract in a header comment. The five below do the heavy
lifting; the rest (`ai.js`, `brief.js`, `drawer.js`, `panel-story.js`, `route.js`, `steps.js`,
`story-bank.js`, `submission.js`) handle the AI helpers, the step pager, the support drawer, the
story bank and the submission gate. `dev-comments.js` is a reviewer tool and is **referenced by no
page** — nothing from it reaches a student or a marker.

| File | What it runs | Used on |
|---|---|---|
| `js/scramble.js` | The sort board — tap an item, tap a bin. One module, two instances. | `look.html` (Panel Scramble), `build.html` (the licence sort) |
| `js/dice.js` | The roll: the V3 deck, the two-per-column deal without replacement, the one re-roll, the lock and the copy string. | `roll.html` |
| `js/copy.js` | The copyable boxes — Clipboard API, then select-the-text, then a spoken instruction. | `build.html`, `help.html` |
| `js/help.js` | The `?topic=` landing highlight and `← Back to where I was`. | `help.html` |
| `js/canvas.js` | The Comic Builder — frame choice, captions, credit slots, undo, export. | `canvas.html` |

Plus the serverless layer in `api/`: `idea.js`, `alt-text.js`, `render.js`, `gifs.js` and the shared
`_openrouter.js`. All four routes return **401** to an unauthenticated POST, which confirms the
class-password gate is live in production. That does **not** prove the OpenRouter and Giphy keys are
valid — one supervised authenticated call is still outstanding.

---

## Preview locally

```bash
cd ~/Projects/mtps504-a2-website
python3 -m http.server 8799
# then open http://127.0.0.1:8799/
```

A plain file open (`open index.html`) also works — there is nothing that needs a
server. The server is only so relative links and `?topic=` parameters behave exactly
as they will in production.

Check it at the two design targets: **1024 × 768** (school laptop, iPad landscape)
and **768 × 1024** (iPad portrait).

---

## How the shared navigation works

This is plain multi-page HTML with no build step and no templating, so both `<nav>`
blocks are **duplicated verbatim in all eleven pages** — the eight nav pages plus
the three sub-pages (`bank.html`, `canvas.html`, `safety.html`), which carry the same
top nav but no `aria-current="page"`, because they are not destinations in it.

**Static markup was chosen over a `js/nav.js` DOM injection** for one reason: with JS
injection, a page loaded with scripts blocked has no navigation at all. On a school
trolley that is a dead site. Static markup means the worst case is a site with no
interactivity but complete, working navigation.

The blocks are fenced by comments:

```html
<!-- ===== NAV:TOP — START ... -->        ... <!-- ===== NAV:TOP — END ... -->
<!-- ===== NAV:BOTTOM — START ... -->     ... <!-- ===== NAV:BOTTOM — END ... -->
```

### Rules for anyone editing a page

- **Top nav:** copy it byte-for-byte. The *only* permitted difference between pages is
  which `<a class="topnav__link">` carries `aria-current="page"`: exactly one on each of
  the eight nav pages, none on the three sub-pages.
  Everything else — order, hrefs, labels, sub-labels — is identical everywhere.
- **Bottom nav:** the four-zone *structure* is identical on every page
  (`?` help → back → steps → primary). Only the labels, the hrefs and the `?topic=`
  deep link change. Zone order never changes.
- **Between the fences is nav. Everything you write goes in `<main id="main">`.**

If the top nav ever has to change, change it in all eleven pages in the same commit and
re-run the checks below.

### Verifying

There is no test framework. This script catches the things that actually go wrong —
a nav that drifted, a dead link, a missing `aria-current`, a broken fragment, a CDN
that crept in. It passes on a clean tree.

Three things it deliberately does **not** assume, because the earlier version did and
was wrong on `main`:

- **Not every page is a nav page.** `bank.html`, `canvas.html` and `safety.html` are a
  Build tool, a Build tool and a support page. They are not in the eight-item top nav
  and correctly carry **no** `aria-current="page"`. The eight nav pages are read out of
  the nav itself rather than hard-coded, and each must mark *its own* link.
- **Formatting is not identity.** `canvas.html` writes each nav item on one line;
  every other page indents it. The navs are compared with whitespace between tags
  squashed, so all eleven are checked against each other for real.
- **Not every `href` is a file.** Off-site links (Met, Wikimedia, ACMI, Padlet, Creative
  Commons) are links a student clicks, not requests the page makes. The no-third-party
  rule applies to `<script>`, `<link>` and `<img>` — the two documented `<iframe>`
  embeds (Padlet, youtube-nocookie) are the only outbound loads.

```bash
python3 - <<'PY'
import re, glob, os, sys

NAV_RE   = re.compile(r'<nav class="topnav".*?</nav>', re.S)
CURRENT  = ' aria-current="page"'
EXTERNAL = re.compile(r'^(?:[a-z][a-z0-9+.-]*:|//)', re.I)

def squash(s):
    return re.sub(r'>\s+<', '><', re.sub(r'\s+', ' ', s)).strip()

pages = sorted(glob.glob('*.html'))
navs, problems = {}, []

def check(cond, msg):
    if not cond: problems.append(msg)

first = open(pages[0], encoding='utf-8').read()
nav_pages = set(re.findall(r'<a class="topnav__link" href="([^"#?]+)"',
                           NAV_RE.search(first).group(0)))
check(len(nav_pages) == 8, 'top nav should link to 8 pages, links to %d' % len(nav_pages))

for f in pages:
    s = open(f, encoding='utf-8').read()
    m = NAV_RE.search(s)
    check(bool(m), '%s: no top nav' % f)
    if not m: continue
    top = m.group(0)
    navs.setdefault(squash(top.replace(CURRENT, '')), []).append(f)

    n = top.count(CURRENT)
    if f in nav_pages:
        check(n == 1, '%s: expected 1 aria-current="page", found %d' % (f, n))
        check(re.search(r'href="%s"[^>]*aria-current="page"' % re.escape(f), top),
              '%s: aria-current is not on its own nav link' % f)
    else:
        check(n == 0, '%s: not in the top nav, so it must carry none (found %d)' % (f, n))

    check(len(re.findall(r'<h1[ >]', s)) == 1, '%s: expected exactly 1 <h1>' % f)

    ids = set(re.findall(r'id="([^"]+)"', s))
    for h in sorted(set(re.findall(r'href="#([^"]+)"', s))):
        check(h in ids, '%s: dead fragment #%s' % (f, h))

    for h in sorted(set(re.findall(r'href="([^"]+)"', s) + re.findall(r'src="([^"]+)"', s))):
        if h.startswith('#') or EXTERNAL.match(h): continue
        check(os.path.exists(h.split('?')[0].split('#')[0]), '%s: dead link %s' % (f, h))

    for tag, attr in re.findall(r'<(script|link|img)\b[^>]*?\b(?:src|href)="([^"]+)"', s):
        check(not EXTERNAL.match(attr), '%s: external %s %s' % (f, tag, attr))

check(len(navs) == 1, 'top nav differs between pages: %s' % list(navs.values()))

if problems:
    print('\n'.join('FAIL ' + p for p in problems)); sys.exit(1)
print('ok — %d pages, %d in the top nav' % (len(pages), len(nav_pages)))
PY
```

Then the JavaScript, which the script above does not parse:

```bash
node --check js/canvas.js && node --check api/render.js && node --check js/story-bank.js
```

#### The Comic Builder regression check

`#build-comic` and `#finish` live inside `#tool`, which stays `display:none` until the
class gate is passed. A hash change that does not reload the page — the bottom-nav
pill, the back button, a deep link — used to hide the gate and "show" a step inside
that still-hidden wrapper, and the builder went blank with no way back. Three entry
paths, all of which must work:

1. **Cold load `canvas.html#finish` with no password.** The hash is dropped and the
   Unlock step is what you see. `#tool` stays hidden; nothing goes blank.
2. **Cold load `canvas.html#finish` in a session that has already unlocked.** You land
   on Download, not on Build. Paste in the console:

   ```js
   const f = document.getElementById('finish');
   getComputedStyle(f).opacity === '1' && f.getBoundingClientRect().height > 0
   // → true
   ```

   Run it in a **foreground** tab. A CSS animation does not advance while a tab is not
   being painted, which is why the `step-in` keyframes animate transform only — a
   stalled fade would report `opacity: 0` and read as "the panel is missing".
3. **Stepping through in one session.** Unlock (or Guest mode) → Build your comic →
   Download, then the bottom-nav pills in both directions.

---

## Project assets and manual setup

- **Worked example strip.** `img/exemplar-strip.png` is a local, wordless four-panel
  teapot example. It appears on Home, the brief and Build with descriptive alt text.
- **Home hero.** `img/home-hero.png` is a local illustration that introduces the four-panel
  idea without adding another block of instructions.
- **The Padlet boards are live and embedded**, not placeholders: Roll Call
  (`padlet.com/embed/xgv9pa9bf9197dav`) on `2 Roll`, and the final submission board
  (`padlet.com/embed/bimq0a9uiwaw10zr`) on `5 Share`, gated behind a recorded comic download.
- **The Google Form and Google Slides workflow are retired** (16 Aug 2026). Any document in the
  assignment workspace still describing them is stale — see
  `.../assignments/planned/mtps504-a2/START-HERE.md`.
- **One `CONFIRM` remains:** an optional Khan Academy embed on `plan.html:160`, currently a link card.

---

## Verified

Measured with headless Chromium at 1024 × 768, 768 × 1024, both at 100% and at 200%
text size, plus 375 × 667:

- **Home does not scroll at either design target** (0px overflow at both).
- Both bars and the page's primary action are on screen on all eight pages, at every
  size tested.
- No horizontal scroll anywhere.
- No content sits under the fixed bottom bar at any size, including 200%.
- Smallest interactive target is 44 px.
- First Tab stop is the skip link, on every page.
