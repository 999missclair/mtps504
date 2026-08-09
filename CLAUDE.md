# Four Frames — repo rules

Year 8 Visual Arts creative-technologies site for MTPS504-A2 (Curtin). This is
Clair's coursework and it goes to a marker under her name.

## Commits

**This repo's commits are Clair's alone.**

- Author is always `999missclair` — set in this repo's local git config, so it holds
  regardless of which account `gh` is currently logged in as.
- **No assistant attribution.** No `Co-Authored-By: Claude`, no `Claude-Session:`,
  no "Generated with" line. A `commit-msg` hook strips them if they appear, but
  don't write them in the first place.
- Subject lines start with an **action verb**, present tense, in Clair's voice —
  what changed and why it matters to a Year 8. See `git log` for the established style.

## The site

- Plain HTML, CSS and JS. **No frameworks, no build step, no external requests**
  (the one exception is the embedded TED video). Images are served locally from
  `img/` — never hotlink a museum.
- Design targets **1024×768** and **768×1024** (school laptops and iPad). 44px
  minimum touch targets.
- The bottom nav is a pager: one section on screen at a time (`js/steps.js`).
  Nothing should require scrolling to be *found*.
- Palette and type are fixed and accessibility-tested. Don't introduce a colour
  without measuring contrast against WCAG AA and recording the ratio.
- **No exclamation marks** in student-facing copy, and no performed enthusiasm.
  Thirteen-year-olds read it as condescension.

## Source of truth

The design document, not this README and not the mockup:

```
Master of Teaching - Visual Arts/Clair Assignment System/assignments/planned/
  mtps504-a2/working/site-map-and-design.md
```

Anything only Clair can create (Slides template, Padlet boards, Forms, exemplar
PNG) gets a labelled placeholder on the page and a line in that workspace's
`progress.md` under "Waiting on Clair".
