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
blocks are **duplicated verbatim in all eight files**.

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
  which `<a class="topnav__link">` carries `aria-current="page"`. Exactly one per page.
  Everything else — order, hrefs, labels, sub-labels — is identical everywhere.
- **Bottom nav:** the four-zone *structure* is identical on every page
  (`?` help → back → steps → primary). Only the labels, the hrefs and the `?topic=`
  deep link change. Zone order never changes.
- **Between the fences is nav. Everything you write goes in `<main id="main">`.**

If the top nav ever has to change, change it in all eight files in the same commit and
re-run the checks below.

### Verifying

There is no test framework. This one-liner catches the things that actually go wrong —
a nav that drifted, a dead link, a missing `aria-current`, a broken fragment:

```bash
python3 - <<'PY'
import re, glob, os
navs = {}
for f in sorted(glob.glob('*.html')):
    s = open(f, encoding='utf-8').read()
    top = re.search(r'<nav class="topnav".*?</nav>', s, re.S).group(0)
    navs[f] = re.sub(r' aria-current="page"', '', top)
    assert top.count('aria-current="page"') == 1, f'{f}: aria-current'
    assert len(re.findall(r'<h1[ >]', s)) == 1, f'{f}: h1 count'
    ids = set(re.findall(r'id="([^"]+)"', s))
    for h in set(re.findall(r'href="#([^"]+)"', s)):
        assert h in ids, f'{f}: dead fragment #{h}'
    for h in re.findall(r'href="([^"#][^"]*?)"', s):
        assert os.path.exists(h.split('?')[0].split('#')[0]), f'{f}: dead link {h}'
    assert not re.search(r'(?:src|href)="(?:https?:)?//', s), f'{f}: external request'
assert len(set(navs.values())) == 1, 'top nav differs between pages'
print('ok —', len(navs), 'pages')
PY
```

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
