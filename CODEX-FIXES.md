# Four Frames — remaining fixes (Codex goal prompt)

You are finishing a nearly-complete Year 8 Visual Arts project website called **Four Frames**.
Work through the fixes below in priority order. This file is your brief — read the linked
references before you start, follow the ground rules exactly, verify each fix, and commit per
logical change in the site's commit tone (see the end). **Do not deploy, do not push, do not
enter any password or API key.**

---

## 1. What Four Frames is

A student-facing **hub** for a Year 8 Visual Arts creative-technologies project: students make a
**four-panel wordless comedy comic** (four pictures, no words, one joke that lands on the last
frame). They don't draw — they roll a story (dice), find/licence pictures, and build the comic in
an **in-site Comic Builder**, then post it to a class Padlet.

- **Repo:** `/Users/aaronnganm1/Projects/mtps504-a2-website`
- **Run it (needs `/api` for the AI + GIF tools, not just static files):**
  ```bash
  cd /Users/aaronnganm1/Projects/mtps504-a2-website
  FFROOT="$PWD" CLASS_PASSWORD="art2026" node /tmp/ff-dev.js >/tmp/ff-dev.log 2>&1 &
  # -> http://localhost:8799   (hard-reload after CSS/JS edits — the browser caches)
  ```
  `.env` (gitignored) holds `OPENROUTER_API_KEY` + `GIPHY_API_KEY`. `ff-dev.js` is a tiny node
  server: serves static files + routes `/api/*.js`.
- **Pages:** `index` (Home) · `brief` (project overview) · `look` (1 Look) · `roll` (2 Roll) ·
  `plan` (3 Plan) · `build` (4 Build) · `share` (5 Share) · `help` (Help Centre) · `canvas`
  (Comic Builder) · `bank` (image bank) · `safety`. JS in `js/`, one shared stylesheet
  `css/site.css`, serverless functions in `api/`.

---

## 2. Reference library — READ THESE FIRST

`ASSIGN` = `/Users/aaronnganm1/Library/Mobile Documents/com~apple~CloudDocs/AN Projects/Yours.Cae/Master of Teaching - Visual Arts/Clair Assignment System/assignments/planned/mtps504-a2`

**Read before touching anything (they explain what's done + what's left):**
- `ASSIGN/working/uplift-report.md` — the most recent state review: what changed, brief compliance, remaining items.
- `ASSIGN/working/confusion-walkthrough.md` — cold Year 8 usability findings + what was fixed.
- `ASSIGN/working/activity-designation-decision.md` — **the three marked activities are Panel Scramble · The Roll + Padlet · The Comic Builder** (keep these intact).
- `ASSIGN/SIMPLIFICATION-PLAN.md` and `ASSIGN/DECISIONS-PENDING.md` — the submission checklist + human-only items.

**Assessment ground truth:**
- `ASSIGN/reference/assignment-brief.md` — the brief (5 required website components; 650-word written plan; AITSL 1.5/2.6/6.2; due **19 Aug 2026**).
- `ASSIGN/reference/source-files/MTPS504-A2-Rubric-SP2-2026.pdf` — the rubric (Criterion 3 technical quality; Criterion 4 learning experience, 20 marks; C6 mechanical/APA).
- `ASSIGN/PEDAGOGY-REFERENCE.md` — the pedagogy spine.

**Design docs (why things are the way they are):**
- `ASSIGN/working/activity-designs.md` · `project-concept.md` · `site-map-and-design.md`
- `ASSIGN/working/gif-canvas-design.md` · `ai-feature-design.md` · `host-design-notes.md`
- `ASSIGN/working/accessibility-audit.md` · `curated-resources.md` · `dice-roll-options.md`
- `ASSIGN/working/site-literature-review/CUT-LIST.md` (cognitive-load / trimming rationale)

**Pedagogy sources (for any copy that makes a research claim):**
- `ASSIGN/reference/unit-reading-list.md` + the PDFs in `ASSIGN/reference/unit-readings/`
- `ASSIGN/working/readings-review/EVIDENCE-SHEET.md` (maps readings → site slots)
- APA reference list: `/Users/aaronnganm1/Library/Mobile Documents/com~apple~CloudDocs/AN Projects/Yours.Cae/Master of Teaching - Visual Arts/Portfolio Development/Master-Reference-List.md`

**Model exemplar (the site to beat on craft):**
- `ASSIGN/reference/exemplars/model-website-sleep-not-HD/` (README + screenshots)

**Repo conventions:** `/Users/aaronnganm1/Projects/mtps504-a2-website/CLAUDE.md` and `README.md`.
**GitHub remote:** `git@github-clair.com:999missclair/<repo>.git` (branch `main`). If you run in the
cloud and can't see the local files, the repo must be pushed first — **ask, don't push it yourself.**

---

## 3. Ground rules (non-negotiable)

1. **UK English**, and **Year 6–8 reading level** — short, warm, imperative; a 13-year-old skims. No jargon.
2. **No external libraries, CDNs, fonts, or remote assets** — a strict CSP blocks them. Vanilla JS only; inline SVG; the self-hosted Fredoka font already exists.
3. **Accessibility is graded and non-negotiable:** every interaction works by **tap AND keyboard**; visible focus rings (never `outline:none` without a replacement); colour is never the only signal; respect `prefers-reduced-motion` and forced-colours; real labels on inputs; captions on by default.
4. **Keep fit-mode intact** on the phase pages: `<body class="fit">`, the `.rail__close` / `.rail-scrim` / `.rail-toggle` hooks, and the `js/steps.js` + `js/drawer.js` scripts. `js/steps.js` self-heals the step pills from `.section` blocks — don't hand-maintain pill counts.
5. **Don't break working logic** — `js/dice.js`, `js/canvas.js`, `js/brief.js`, `js/scramble.js`, `js/ai.js`, `api/*` are tested and working. Only touch them where a task says so.
6. **The rolled brief** is saved on lock to `localStorage['ff-brief']` and displayed by `js/brief.js` in every `[data-brief-banner]` and pinned in the Comic Builder — keep that chain working.
7. **The three marked interactive activities** are Panel Scramble (1 Look), The Roll + Roll Call Padlet (2 Roll), and the Comic Builder (4 Build). Do not remove or demote them.
8. **Commit per logical change** in the site's tone (§6). **Never deploy, never push, never type a password/API key** — those are the human's.

---

## 4. What's already done (do NOT redo)

The AI helpers (idea/alt-text/render), the Comic Builder (GIPHY search, upload, paste, speech
bubbles/captions, drag/resize, PNG export), fit-mode + the "Stuck?" drawer on every phase page,
the dice "story spark", the bank trim (56→12 credited images), the plain-language sweep, the
look-and-feel polish, the one consolidated class-wall Padlet, and the Help-Centre migration off
Google Slides — all shipped. **There is zero "Google Slides" reference left; do not reintroduce
it.** Confirm state from `uplift-report.md` before starting.

---

## 5. The fixes

### P1 — must-do (submission-blocking / marker-visible)

**5.1 `safety.html` is orphaned, unstyled, and has no bottom nav.**
- It uses four classes that **don't exist** in `css/site.css` (so it renders unstyled and breaks the one-visual-system look): `.eyebrow` (safety.html:73), `.lede` (:75), `.steps-list` (:85), `.note` (:92, :138).
- It is **linked from nowhere** (`grep -rl 'safety.html' *.html` → nothing) and has **no `.botnav`**, so a keyboard/screen-reader user who lands there has no help/back bar and no way out.
- **Task:** (a) Give those four elements the site's existing visual system — either add the four classes to `css/site.css` matching site conventions, or better, **swap them for existing classes** (`.eyebrow`→`.phase-tag` or a small caps label, `.lede`→`.lead`, `.steps-list`→`.steps`, `.note`→`.card` or `.small`). (b) Add the standard four-zone `.botnav` (copy the structure from any phase page: `?` help · back · steps · primary). (c) Make it **reachable** — add a discreet link in the site footer (the `.reassure`/footer block that appears on every page) e.g. "Worried about something? → Staying safe", or add it to the Help Centre's topic list. Keep it out of the numbered phase top-nav.
- **Accept:** safety.html renders in the site's visual system, is reachable from at least one always-present link, and is keyboard-navigable with a working bottom nav. No undefined classes remain (grep `css/site.css`).

**5.2 Remove author-TODO markers and dead controls from student-facing pages.**
- `build.html:544` — a `disabled` `btn-primary btn-block` (a dead "post to the gallery" button) → **remove it** (the real class-wall Padlet + hand-in path already live on 5 Share).
- `build.html:549` — `<span class="needs-clair">Needs Clair</span> the gallery board…` → **remove/settle** (the board is live on Share; point there or drop the line).
- `build.html:492` — the exemplar `Needs Clair` block → keep the placeholder figure but move the "Needs Clair" instruction into an **HTML comment** so students don't see it (see 5.6).
- `plan.html:148` — `<span class="needs-clair">Verify</span> one video…` → move the "Verify" author note into an HTML comment; the Pixar/Khan resource works as a link meanwhile.
- `safety.html:138` — `<span class="needs-clair">Who to tell:</span>` is **not** an author TODO, it's a real label wearing the wrong class → give it a proper label style (a `<strong>` or a small caps label), not the red "Needs Clair" chip.
- **Accept:** `grep -rn 'needs-clair\|Needs Clair\|>Verify<' *.html` returns only genuine, intentional, student-appropriate uses (or none); no `disabled` buttons remain except the dice **Lock it in** button (`data-dice-lock`, which JS enables after a roll).

**5.3 Let a marker reach the Comic Builder from the live link.**
- `canvas.html` (the Producing activity, the site's centrepiece) sits behind a class-password gate (`#gate-section`; server refuses `/api/*` without `CLASS_PASSWORD`). A marker opening the submitted URL can't walk it.
- **Task:** add a **guest/preview path** that lets a visitor use the builder's non-server features (upload a picture, paste, add speech bubbles/captions, arrange, export) **without** the class password and **without** exposing any key — e.g. a "Just looking? Try it without the class password" link that reveals the tool with GIPHY search disabled (a note: "GIF search needs the class password"). Do it in `js/canvas.js` (the gate logic) + `canvas.html`. Keep the real class-password path for GIPHY/AI. **Do not** hardcode or expose the password or any API key.
- **Accept:** from a fresh browser (no `sessionStorage`), a visitor can open canvas.html, enter guest mode, add an uploaded/pasted image, add a bubble, and export a PNG — with no console errors and no key in the page source.

### P2 — should-do (marks / UDL)

**5.4 Add the two-bin easy-mode toggle to the Build licence sort.**
- The Panel Scramble on 1 Look has a full `data-fb2` two-bin scaffold (12 occurrences); the Build **licence sort** uses the same `js/scramble.js` engine but has **no** `data-fb2` toggle (0) — so the anxiety-reducing easy mode is missing on the *more legally-loaded* activity.
- **Task:** mirror Look's `data-fb2` two-bin toggle onto the Build licence-sort markup so it also offers "Try it with two bins". Reuse `js/scramble.js`; no JS changes if the markup contract matches.
- **Accept:** the licence sort offers a working two-bin easy mode by tap and keyboard, matching Look's behaviour.

**5.5 State the AI render's boundary on 3 Plan.**
- The optional AI render (`plan.html`, `[data-ai-render]`) produces a rough four-panel image. Add one plain line, near the widget, naming the boundary for a skimming marker and the student: e.g. *"The machine makes a rough guess to argue with — you're the director, and you make the real four frames yourself."* (This is the governing "AI asks/previews, never replaces the maker" principle — see `ASSIGN/working/ai-feature-design.md`.)
- **Accept:** the framing line is visible on 3 Plan beside the render widget.

**5.6 Reconcile the "nothing is saved" claim with `ff-brief`.**
- `js/dice.js` header comment still says *"No storage of any kind. No localStorage, no sessionStorage, no cookie… these are claims made in the video rationale."* That's now **false** — locking the roll saves `localStorage['ff-brief']` (device-only) so the story can follow the student, and `js/canvas.js` saves `ff-comic`.
- **Task:** update the `js/dice.js` header comment (and any on-page "nothing is saved" copy that overstates it) to state the honest, precise position: *nothing is sent anywhere and there are no accounts or cookies; the only thing kept is your rolled story and your comic-in-progress, saved on this one device so they don't vanish when you move pages.* Leave a note that the **video rationale + written plan** must use the same nuance (that's the human's copy, not code).
- **Accept:** no code comment or on-page line claims "no storage of any kind"; the device-only exception is stated wherever the claim appears.

### P3 — polish (if time)

**5.7 Padlet naming consistency.** Sweep every footer/label so the board is called **"class wall"** consistently (some footers may still say "gallery"/"planner"). `grep -rin 'gallery\|planner' *.html` and settle.

**5.8 Worked-example exemplar (code half only).** The finished teapot strip is a `NEEDS CLAIR` placeholder on Home/Brief/Build (a 1600×1200 PNG). You **can't generate the image** — but wire the swap so that once `img/exemplar-strip.png` exists it drops straight in (leave a single clear HTML comment with the exact `<img>` to paste, and make the placeholder copy honest, not "look at the example above" when there's only a grey box). The **image itself** is a human task (see §7).

---

## 6. Commit style — match the site's tone

Commit **per logical change**, not one giant commit. Match the existing history's tone: a short
**imperative** subject line (what changed), a blank line, then a body of plain **UK English**
explaining *what* and *why* (bullets are fine), warm but precise — the same register as the site
copy. Real examples from this repo:

```
Reframe the three interactive activities; migrate Help Centre to the Comic Builder

The Comic Builder is an embedded in-site storyboard designer (a brief example),
so it counts as the Producing activity. Designate the three marked activities as
Panel Scramble -> The Roll + Padlet -> Comic Builder and name them on Brief.
- Help Centre migrated off Google Slides onto the Comic Builder.
- 3 Plan reads as a design bridge; dropped leftover Google-Form copy.
```
```
Comic Builder: speech-bubble text scales with the bubble and sits centred
```

Keep subjects ≲72 chars. Use your own author/co-author trailer or none — don't impersonate another
tool's trailer. **Do not `git push` and do not deploy.**

---

## 7. Out of scope — human-only (do NOT attempt; list them in your final summary)

These need the human (Clair) and are tracked in `ASSIGN/DECISIONS-PENDING.md` +
`ASSIGN/SIMPLIFICATION-PLAN.md`:

- **Deploy** — push `main` + set the three Vercel env vars (`OPENROUTER_API_KEY`, `GIPHY_API_KEY`, `CLASS_PASSWORD`). The keys are the human's to type.
- **The exemplar teapot comic IMAGE** — make it in the Comic Builder and export `img/exemplar-strip.png`.
- **The two Padlet boards / the Pixar-Khan embed snippet** — created in the human's own accounts.
- **The 650-word written plan** (Introduction 300 + Professional-learning reflection 350), the **3-minute video + transcript**, the **APA reference list**, and **screenshots** — the human's deliverables.
- **Real school details** and **citation hygiene** in the written plan (see uplift-report.md gaps).

---

## 8. Verification (run before you call it done)

Start the dev server (§1) and, for each fix:
1. Load the affected page(s) at `http://localhost:8799` and confirm the fix visually + by keyboard.
2. Check the **browser console has zero errors** on every page you touched.
3. Run the relevant grep from the acceptance criteria (e.g. `grep -rin 'slides' *.html js/*.js` → none; `grep -rn 'needs-clair\|disabled' *.html` → only intentional).
4. Confirm you didn't break the core flow: **roll → Lock it in (story spark + `ff-brief` saved) → the banner shows on Plan/Build/Bank → the Comic Builder pins the story → build → export a PNG.**
5. For any JS you edit: `node --check js/<file>.js`.
6. End with a short report: what you fixed, what you deliberately left (P3 / out-of-scope), and any place you were unsure.
