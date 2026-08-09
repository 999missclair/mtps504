# The class image bank — sourcing method

**Last verified: 9 August 2026.** This is the paper trail for `image-bank.csv` and the
generated `bank.html`. It answers the questions a marker, a teacher taking this unit over,
or Clair adding a new image in six months would ask: where did these come from, how was the
licence actually checked (not assumed), what got rejected and why, and how do you add one
more.

Built in response to `pedagogical-review.md` priority item #1 ("the single biggest problem"
— a shared-laptop Year 8 class cannot run a live open-web licence-search workflow in one
50-minute lesson) and Clair's fourth priority instruction (ship the bank as an auditable
register in the repo, not a Padlet or a Drive folder nobody can check).

---

## Why the register is the point, not just the pictures

`ORCHESTRATION-LOG.md`'s fourth instruction is explicit: this is direct evidence for
Criterion 2's "safe, responsible and ethical use of ICT" descriptor, and it's the thing a
video can point a camera at. A folder of pictures proves nothing on its own. A CSV where
every row's title, creator and licence were pulled from the source's own API response —
not typed from memory, not guessed — proves the checking actually happened, and it's
checkable by anyone who opens `image-bank.csv` and follows a `source_url`.

---

## Collections used, and why

| Collection | Why it's here | API used |
|---|---|---|
| **The Met Open Access** | About half a million artworks released with **no restrictions at all** — `isPublicDomain: true` is a hard, machine-readable flag, so a Met row is the strongest possible provenance for a CC0 claim. Best for the CHARACTER cards — the armour, the teapot, the Bastet bronzes, Grandville's *Mister Vulture* and the Desplaces singerie engraving all come from here. | `collectionapi.metmuseum.org/public/collection/v1/search` then `.../objects/{id}` |
| **Wikimedia Commons** | The only collection with everyday, situational photography (a fire alarm bell, a feather duster, a school group) as well as museum objects — and, after the anthropomorphic rebuild, the source for most of the CHARACTER cards too: the Chōjū-giga scrolls, the Bodleian manuscript margin, the Kuniyoshi cat prints, Louis Wain, Kaulbach's foxes, the Notre-Dame chimeras and Chardin's monkey painter. The trade-off: licence changes file to file, so every single file's own `extmetadata` was read — nothing about Commons is assumed collection-wide. | `commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata|url` |
| **Openverse** | A meta-search across millions of openly licensed photos, with the licence filter built into the query (`license_type=commercial,modification`), which is why it's strongest for the SITUATION cards that have no museum-object equivalent (a child running, a fire alarm, a tour group). | `api.openverse.org/v1/images/` |
| **Rijksmuseum** | **Not used.** Its search API requires a registered API key; this build had none, and rather than skip verification, the Met + Commons + Openverse trio covers all 24 cards. If a key is added later it would be a good extra source for the European printmaking cards — Grandville and the singerie engravings especially. |

---

## How licence status was verified — the actual method

**No title, creator, date or licence in this CSV was typed from memory or guessed.** Every
row was built by reading a live API response and copying its fields:

1. **Met rows.** Call `search?hasImages=true&q=<term>` to get candidate `objectID`s, then
   call `objects/{objectID}` for the full record. Only rows where the record's own
   `isPublicDomain` field is `true` were used. `title`, `artistDisplayName`, `objectDate`,
   `objectURL` and `primaryImageSmall` all come straight from that JSON — none were reworded.
2. **Commons rows.** Call `action=query&titles=File:<name>&prop=imageinfo&iiprop=extmetadata|url`.
   The licence is `extmetadata.LicenseShortName.value` and its URL is
   `extmetadata.LicenseUrl.value` — read from the file's own metadata box, the same box a
   student is taught to find in Help Centre Topic 3. Creator comes from
   `extmetadata.Artist.value` (HTML stripped), date from `DateTimeOriginal` or `DateTime`.
   Only **Public Domain, CC0, CC BY (any version) and CC BY-SA (any version)** licences were
   accepted.
3. **Openverse rows.** The query itself is filtered to `license_type=commercial,modification`,
   which already excludes ND and NC results at the API level — nothing here needed a second
   manual check for those two conditions. `title`, `creator`, `license`, `license_version` and
   `license_url` are read straight from each result object.

---

## Why the bank stays open-licence, when classroom use is broader

**Updated 9 August 2026.** The unit's copyright position was researched properly and it
turned out to be two positions, not one — see
`working/copyright-position.md` in the assignment workspace for the full paper trail. The
short version, because it decides everything on this page:

**Inside the school, students have more room than this bank uses.** A Year 8 sourcing
images for a marked Visual Arts task is doing *research or study* (**s 40**, Copyright Act
1968), and a Year 8 making a comedic four-frame strip out of an artwork is doing *parody or
satire* (**s 41A**) — which the National Copyright Unit says covers "copying, adapting,
performing and communicating". The teacher assembling a source pack for twenty-six students
is relying on the **s 113P** statutory educational licence, which the WA Department of
Education already pays Copyright Agency for, and which expressly permits copying "the whole
of an artistic work".

**None of that reaches a public website, and this bank is on one.** The NCU's guidance for
people building teaching resources is unambiguous:

> "If you choose to rely on the statutory licences or the educational use copyright
> exceptions, **you can never make that material available on a public website.**"
> — `https://smartcopying.edu.au/creating-learning-and-teaching-resources/`

And the same body's condition on the statutory licence:

> "Access to material copied and communicated under the Statutory Text and Artistic Works
> Licence **must be restricted (eg by use of a password) to teachers and students. You must
> ensure that the material is not able to be accessed by the general public.**"
> — `https://smartcopying.edu.au/guidelines/artistic-works-and-images/`

`bank.html` is deployed to Vercel. It has a public URL. Anyone can open it, including the
marker. So the bank sits on the **public** side of that line, and on the public side the
only thing carrying an image is an open licence you can name. **That is why nothing in the
qualification rule below has been relaxed, and why it never should be.**

The distinction is also the point pedagogically. The bank is not a fence around what
students may use — it is the *fast* route, and it is what a public gallery of Year 8 work
would have to be built from. Students who go off it in class are not breaking a rule; they
are in a different, broader situation, and 4 Build now teaches them which is which.

*(For completeness, and because it was checked rather than assumed: **flexible dealing is
s 200AB**, not s 113F — s 113F is the disability provision. And s 200AB(6) makes flexible
dealing unavailable here anyway, because s 113P already covers artistic works.)*

---

## The qualification rule

**Open licence only, for everything on this public site. The institution's own object page
is the source of record**, not a search-results thumbnail or a reverse-image-search hit.
Concretely:

- Accepted: **Public Domain, CC0, CC BY, CC BY-SA.**
- Rejected outright: **anything ND** (No-Derivatives) — a thumbnail crop is a derivative
  work, so an ND image can never legally become a dice-card thumbnail.
- Avoided where an alternative existed: **CC BY-NC** — fine for a genuinely non-commercial
  class gallery, but a weaker default than a licence with no commercial condition at all.
  As it happens no NC row survived into the final bank.
- A result with **no licence stated** on its own page was never used, no matter how good the
  picture — this is the rule taught on the Build page itself ("anything you post publicly
  uses an image whose licence you can name") and the bank practises what it teaches.

---

## What was rejected in the anthropomorphic rebuild (9 August 2026)

Nine CHARACTER cards were re-sourced from scratch. These are the rejections, and they are
more instructive than the acceptances:

- **Arthur Rackham's *Aesop's Fables* (1912) and Walter Crane's *The Baby's Own Aesop*
  (1887).** Both were on the shortlist for "a fox in a gentleman's coat" and both are
  properly public domain. Both were rejected after the plates were **downloaded and looked
  at**: the animals are drawn naturalistically and *unclothed*. The two most obvious
  illustrators of dressed fable animals do not, in fact, dress them. The card became
  Wilhelm von Kaulbach's *Reineke Fuchs* (1846) instead — a fox in a ruffed shirt, reading
  a book. **This is the single best argument on this page for the "look at it" step**:
  nothing in the catalogue metadata would have caught it.
- **The Smithfield Decretals "beheading rabbit"** (British Library, Royal MS 10 E IV) is
  literally the best "rabbit with a sword" image in any open collection, and it is a
  decapitation with visible blood. Rejected on content, not licence.
- **Kaulbach's *Reineke* plate 2** — a beautifully dressed fox, reclining in a larder hung
  with skinned carcasses.
- **Kuniyoshi's *bakeneko* prints**, including the Met's *Scene from a Ghost Story: The
  Okazaki Cat Demon* — supernatural horror, monstrous ghost-cats, not cats behaving like
  people.
- **Louis Wain's *The bachelor party*** — superb dressed cats; also five cats smoking
  cigars beside gin bottles.
- **David Teniers the Younger's *Singerie*** (KMSKA) — the monkey is smoking a pipe and
  drinking wine. A genuinely good satire discussion piece for a teacher; not in a
  student-facing bank.
- **Commons file *Medieval rabbits (7).jpg*** — the file page claims public domain, but its
  only stated source is **Pinterest**. No manuscript, no folio, no institution. **Rejected
  on provenance, not licence.** A licence box is only as good as the chain behind it, and
  "someone on Commons says it's fine" is not a chain.
- **Met "Kuniyoshi's Cats" (Paul Binnie, 2004)** — `isPublicDomain: false`. And every
  **Yasuo** Kuniyoshi result: a 20th-century American painter, in copyright, and a real
  trap in the Met's search index for anyone searching the name "Kuniyoshi".

Two accepted images were **cropped** so the character reads at the 96px card size — the
Bodleian manuscript's lower margin band, and the Grandville drawing away from its mount.
Cropping is a derivative act, which is exactly why nothing ND is ever accepted into this
bank; with PD and CC BY / CC BY-SA rows it is permitted.

---

## What was rejected, and why (real examples from the first build)

- **The Edward Colston plinth** (Bristol) was the top Commons hit for *empty pedestal
  statue* (card s11). Rejected — not on licence grounds, but because a toppled-slaver-
  monument plinth carries a whole political conversation a Year 8 dice-card thumbnail can't
  hold. A neutral empty-plinth image was used instead. (First flagged in
  `dice-roll-options.md`'s original verification sweep; carried forward here.)
- **`museum fire alarm test`** as a search term returned almost nothing on topic (4 Openverse
  results, mostly unrelated defence-industry photographs). Rewritten to `fire alarm bell`,
  which returns a clear, classroom-legible wall-mounted bell — the object stands in for the
  situation, the same move the site's own Help Centre teaches ("search the object, not the
  event").
- **`feather duster cleaning`** returned very few Openverse results (9); Wikimedia Commons
  was used as the primary source for that card instead, once its own licence box was checked
  file by file.
- Any image that failed the classroom-appropriateness screen (blurry past 96–400px, subject
  unclear at thumbnail size, or anything a Year 8 classroom shouldn't be looking at) was
  deleted after download rather than shipped with a caveat — the CSV only lists what actually
  survived that check.
- Rows that could not be fully verified against a live source (metadata thin or ambiguous)
  are kept in the CSV **marked `⚠️ UNVERIFIED`** in the `notes` column rather than deleted —
  `tools/build-bank.py` excludes any row with that tag from the generated `bank.html`
  automatically, so an unverified row can never reach a student, but the gap stays visible
  and fixable.

---

## How to add a new image — step by step

1. **Search.** Use the card's existing `searchTerm` from `dice-roll-options.md` / `js/dice.js`,
   or write a new one following that file's rule: name it like a photographer would title a
   photograph ("fire alarm bell"), not like a description of the scene ("a fire alarm being
   tested"). Test it against Met, Commons or Openverse before it goes anywhere near the CSV.
2. **Verify from the live API**, not the search-results page. Open the object/file page (Met
   object page, Commons file page, or the Openverse `foreign_landing_url`) and read title,
   creator, date and licence off it directly.
3. **Check the licence is one of: Public Domain, CC0, CC BY, CC BY-SA.** If it's ND, stop —
   don't use it. If it's NC, only use it if nothing better is available.
4. **Download** the image — Commons' `?iiurlwidth=800` thumbnail, the Met's
   `primaryImageSmall`, or the Openverse `url` field — into `img/bank/`, named
   `<row-id>.<ext>` (match the `id` column exactly, extension `.jpg`/`.png` as downloaded).
5. **Resize** if it's over 1200px on the long edge: `sips -Z 1200 img/bank/<file>`.
6. **Look at it.** Open the downloaded file and check it reads clearly at thumbnail size and
   is appropriate for a Year 8 classroom. If it fails either test, delete it and don't add
   the row.
7. **Write the CSV row** — see the column spec and worked examples below. Write the
   `attribution_line` yourself, following the pattern for that licence type. Write `alt_text`
   yourself, plain and descriptive.
8. **Rebuild the page:** `python3 tools/build-bank.py` from the repo root. It reads the CSV
   and regenerates `bank.html`. No install step, no dependency — standard library only.
9. **Commit** the CSV, the new image file(s) and the regenerated `bank.html` together.

---

## Attribution-line construction, by licence type

Every `attribution_line` is the **complete, ready-to-paste credit** — the exact string a
student copies into the box at the bottom of their slide. Two patterns, matching what CC's
own guidance requires for each licence family:

### CC0 / Public Domain

```
Title, Creator (Date). Institution. Public domain/CC0.
```

Worked example (a real row in the CSV):

```
Under the Wave off Kanagawa (Kanagawa oki nami ura), also known as The Great Wave,
Katsushika Hokusai (ca. 1830–32). The Metropolitan Museum of Art. Public domain (CC0).
```

### CC BY / CC BY-SA

```
Title — Creator — Source — Licence
```

This is the same four-part format taught on 4 Build and in Help Centre Topic 3, so a
student who has read one has effectively read both. The licence code must always be spelled
out (not just "CC") so the student can literally name it, per the site's own rule.

Worked example (CC BY):

```
Teapot reflection — Dai Lygad — Openverse — CC BY 2.0
```

Worked example (CC BY-SA — note the share-alike condition is not restated in the credit
line itself; it's taught separately on 4 Build and in the licence-sort activity):

```
Wooden packing crates for the transport of fruit and vegetables — geograph.org.uk —
Wikimedia Commons — CC BY-SA 2.0
```

---

## Column spec (for reference — see `image-bank.csv` for the live data)

```
id,deck_card,field,title,creator,date,holding_institution,source_url,image_url,
licence,licence_url,attribution_line,alt_text,verified_date,notes
```

| Column | What goes here |
|---|---|
| `id` | Unique row id, also the local filename in `img/bank/` (without extension) |
| `deck_card` | The dice-card id and label, e.g. `c1 — A frolicking rabbit` |
| `field` | `character` or `situation` |
| `title`, `creator`, `date` | Exactly as the source's own metadata states them |
| `holding_institution` | The Met / a named Commons uploader / the Openverse source, as the record itself names it |
| `source_url` | The object/file page — the source of record, not the raw image URL |
| `image_url` | The actual file URL downloaded from |
| `licence`, `licence_url` | The licence code and its own reference URL |
| `attribution_line` | The complete, ready-to-paste credit — see above |
| `alt_text` | Written for this project, plain, descriptive, Year-8-appropriate |
| `verified_date` | The date the live API response was read |
| `notes` | Anything worth flagging; `⚠️ UNVERIFIED` here excludes the row from the generated page |

---

## What's still Clair-only

**The visual thumbnail check** — every image in the bank should get one more look at the
actual size it renders on the page, by a human, before Week 1. This build screened every
image on download for obvious problems, but a final pass at real rendered size, on a real
laptop screen, is judgement only Clair can make. Logged in `progress.md` under
Waiting-on-Clair.
