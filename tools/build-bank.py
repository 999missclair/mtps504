#!/usr/bin/env python3
"""
FOUR FRAMES -- build-bank.py

Reads data/image-bank.csv (Clair maintains it in Sheets; this is the source
of truth) and generates bank.html: the class image bank page.

Dependency-free -- standard library only (csv, html, pathlib), so it runs
anywhere Python 3 runs, with no install step. No network requests, no
external template engine.

Usage:
    python3 tools/build-bank.py

Reads:  data/image-bank.csv
Writes: bank.html

Rows whose `notes` column contains the literal string "UNVERIFIED" are
EXCLUDED from the generated page (per the fourth priority instruction) but
stay in the CSV so the gap is visible and fixable later.

The NAV:TOP / NAV:BOTTOM fences below are copied byte-identical from the
site's other pages, with no <a> carrying aria-current="page" (bank.html is
deliberately not a top-nav item -- see site-map-and-design.md the ninth-page
note in section 2).
"""

import csv
import html
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "image-bank.csv"
OUT_PATH = ROOT / "bank.html"

REQUIRED_COLUMNS = [
    "id", "deck_card", "field", "title", "creator", "date",
    "holding_institution", "source_url", "image_url", "licence",
    "licence_url", "attribution_line", "alt_text", "verified_date", "notes",
]

# Deck order for grouping -- character cards c1-c12 then situation cards
# s1-s12, matching the order they appear in dice-roll-options.md and
# js/dice.js, so a teacher scanning the page meets them in the same order
# as the dice board.
DECK_ORDER = (
    [f"c{i}" for i in range(1, 13)] + [f"s{i}" for i in range(1, 13)]
)

CARD_LABELS = {
    "c1": "A Greek marble statue",
    "c2": "A portrait subject, tired of posing",
    "c3": "A suit of armour",
    "c4": "An Egyptian cat sculpture",
    "c5": "A Japanese woodblock wave",
    "c6": "A lemon from a Dutch still life",
    "c7": "A ceramic teapot",
    "c8": "A gallery attendant",
    "c9": "A stuffed bird in a case",
    "c10": "A grand piano",
    "c11": "A stained-glass angel",
    "c12": "A dinosaur skeleton",
    "s1": "The museum has just closed",
    "s2": "A school excursion arrives",
    "s3": "The gallery is being repainted",
    "s4": "The fire alarm is being tested",
    "s5": "Being packed into a crate",
    "s6": "The cleaner has arrived, with a very large duster",
    "s7": "The lights go out",
    "s8": "A very slow tour group",
    "s9": "Being photographed for the catalogue",
    "s10": "A child has escaped the tour",
    "s11": "An empty plinth appears next door",
    "s12": "Someone left a window open",
}


def esc(text):
    return html.escape(str(text or ""), quote=True)


def card_id_from_deck_card(value):
    """deck_card looks like 'c1' or 'c1 -- A Greek marble statue'. Take the
    id token before any separator."""
    token = value.strip().split(" ")[0].split("—")[0].strip()
    return token


def load_rows():
    if not CSV_PATH.exists():
        sys.exit(f"Missing {CSV_PATH} -- nothing to build.")
    with CSV_PATH.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            sys.exit(f"data/image-bank.csv is missing columns: {missing}")
        rows = list(reader)
    return rows


def group_rows(rows):
    groups = {}
    excluded = 0
    for row in rows:
        notes = row.get("notes", "") or ""
        if "UNVERIFIED" in notes.upper():
            excluded += 1
            continue
        card_id = card_id_from_deck_card(row.get("deck_card", ""))
        groups.setdefault(card_id, []).append(row)
    return groups, excluded


BANK_DIR = ROOT / "img" / "bank"


def find_local_file(row_id):
    """The CSV has no local-file column (the column spec is fixed) -- the
    convention is one downloaded file per row, named after the row's own
    `id` with whatever extension it was saved in. Look it up on disk."""
    for ext in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
        candidate = BANK_DIR / f"{row_id}{ext}"
        if candidate.exists():
            return candidate.name
    return f"{row_id}.jpg"  # fall back to the conventional name even if missing


def entry_html(row, idx):
    row_id = esc(row.get("id", f"row{idx}"))
    local_name = find_local_file(row.get("id", f"row{idx}"))
    img_src = f"img/bank/{local_name}"
    title = esc(row.get("title", ""))
    creator = esc(row.get("creator", ""))
    institution = esc(row.get("holding_institution", ""))
    date = esc(row.get("date", ""))
    licence = esc(row.get("licence", ""))
    licence_url = esc(row.get("licence_url", ""))
    source_url = esc(row.get("source_url", ""))
    attribution = esc(row.get("attribution_line", ""))
    alt_text = esc(row.get("alt_text", title))
    copy_id = f"credit-{row_id}"

    return f"""
        <li class="card bank-entry">
          <img class="bank-entry__img" src="{img_src}" alt="{alt_text}" loading="lazy" width="400" height="300">
          <div class="bank-entry__meta">
            <p class="bank-entry__title">{title}</p>
            <p class="bank-entry__sub">{creator} &middot; {date} &middot; {institution}</p>
            <p><span class="chip">{licence}</span>
              <a class="tap-link" href="{source_url}" target="_blank" rel="noopener noreferrer">Source page
              <span class="ext-glyph" aria-hidden="true">&#8599;</span>
              <span class="visually-hidden">(opens in a new tab)</span></a>
              {f'<a class="tap-link" href="{licence_url}" target="_blank" rel="noopener noreferrer">Licence <span class="ext-glyph" aria-hidden="true">&#8599;</span><span class="visually-hidden">(opens in a new tab)</span></a>' if licence_url else ''}
            </p>
            <div class="copyable">
              <code id="{copy_id}">{attribution}</code>
              <button type="button" class="copy-btn" data-copy-for="{copy_id}" aria-label="Copy the credit line for {title}">Copy</button>
            </div>
          </div>
        </li>"""


def group_section(card_id, rows, idx_start):
    label = esc(CARD_LABELS.get(card_id, card_id))
    field = "CHARACTER" if card_id.startswith("c") else "SITUATION"
    entries = "\n".join(entry_html(r, idx_start + i) for i, r in enumerate(rows))
    return f"""
    <section class="section bank-group" id="card-{esc(card_id)}">
      <h2><span class="phase-card__sub">{field} &middot; {esc(card_id)}</span><br>{label}</h2>
      <ul class="bank-grid">{entries}
      </ul>
    </section>
"""


NAV_TOP = """<!-- ===== NAV:TOP — START =========================================
     Copy this block verbatim into every page. The ONLY permitted
     difference between pages is which <a> carries aria-current="page".
     bank.html carries NO aria-current — it is not a top-nav item.
     ============================================================= -->
<nav class="topnav" aria-label="Project phases">
  <a class="topnav__brand" href="index.html"><span class="mark" aria-hidden="true">&#9638;</span> Four Frames</a>
  <ul class="topnav__list">
    <li class="is-pinned is-pinned--start">
      <a class="topnav__link" href="index.html">
        <span class="topnav__label">Home</span>
      </a>
    </li>
    <li>
      <a class="topnav__link" href="brief.html">
        <span class="topnav__label">Brief</span>
        <span class="topnav__sub">Project overview</span>
      </a>
    </li>
    <li>
      <a class="topnav__link" href="look.html">
        <span class="topnav__label"><span class="topnav__num">1</span> Look</span>
        <span class="topnav__sub">Investigating &amp; defining</span>
      </a>
    </li>
    <li>
      <a class="topnav__link" href="roll.html">
        <span class="topnav__label"><span class="topnav__num">2</span> Roll</span>
        <span class="topnav__sub">Designing</span>
      </a>
    </li>
    <li>
      <a class="topnav__link" href="plan.html">
        <span class="topnav__label"><span class="topnav__num">3</span> Plan</span>
        <span class="topnav__sub">Designing</span>
      </a>
    </li>
    <li>
      <a class="topnav__link" href="build.html">
        <span class="topnav__label"><span class="topnav__num">4</span> Build</span>
        <span class="topnav__sub">Producing &amp; implementing</span>
      </a>
    </li>
    <li>
      <a class="topnav__link" href="share.html">
        <span class="topnav__label"><span class="topnav__num">5</span> Share</span>
        <span class="topnav__sub">Evaluating</span>
      </a>
    </li>
    <li class="is-pinned is-pinned--end">
      <a class="topnav__link" href="help.html">
        <span class="topnav__label">Help</span>
      </a>
    </li>
  </ul>
</nav>
<!-- ===== NAV:TOP — END ========================================== -->"""

NAV_BOTTOM = """<!-- ===== NAV:BOTTOM — START ======================================
     Same four-zone structure as every other page (design spec 3.4:
     ? help / back / steps / primary), with one deviation, recorded here
     because it is real: bank.html is not a phase page, so it has no step
     pills and no counter -- zone 3 is simply absent. Help, back and
     primary keep the exact same markup pattern as every other page's
     fence. -->
<nav class="botnav" aria-label="Page controls">
  <a class="botnav__help" href="help.html?topic=finding-images">
    <span aria-hidden="true">?</span>
    <span class="visually-hidden">Get help with this page</span>
  </a>
  <a class="botnav__back" href="build.html">
    <span aria-hidden="true">&#8592;</span>
    <span class="label" aria-hidden="true">4 Build</span>
    <span class="visually-hidden">Back to 4 Build</span>
  </a>
  <a class="btn-primary" href="build.html#find">Back to your four steps &#8594;</a>
</nav>
<!-- ===== NAV:BOTTOM — END ======================================= -->"""


def build():
    rows = load_rows()
    groups, excluded = group_rows(rows)
    total_shown = sum(len(v) for v in groups.values())

    ordered_ids = [cid for cid in DECK_ORDER if cid in groups]
    # Any card ids not in the known deck order (e.g. "general") go last.
    extra_ids = [cid for cid in groups if cid not in DECK_ORDER]
    ordered_ids += sorted(extra_ids)

    sections = []
    idx = 0
    for cid in ordered_ids:
        sections.append(group_section(cid, groups[cid], idx))
        idx += len(groups[cid])

    body = "\n".join(sections)

    html_doc = f"""<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Class Image Bank &#8212; Four Frames</title>
<meta name="description" content="Four Frames &#8212; the class image bank. Pictures already matched to the roll, already licence-checked, credit line already written.">
<link rel="stylesheet" href="css/site.css">
</head>
<body>

<a class="skip-link" href="#main">Skip to content</a>

{NAV_TOP}

<main id="main">
<div class="page-shell">

  <header class="page-header">
    <p class="phase-tag">Class image bank</p>
    <h1>Class Image Bank</h1>
    <p class="page-question">These images are already checked. The credit line is written for you &#8212; copy it into your credits box.</p>
  </header>

  <p class="lead">{total_shown} pictures, grouped by dice card. Find your rolled card below,
  pick a picture, press Copy on its credit line, and paste it straight into the box at the
  bottom of your slide. Every picture here has a real, verified licence &#8212; nobody has to
  read a licence box today.</p>

  <p class="small">Want to search the open web instead? That&#8217;s the extension route on
  <a class="tap-link" href="build.html#sources">4 Build &#8594;</a>.</p>

{body}

  <section class="section">
    <h2>Stuck? Try this</h2>
    <div class="card stuck">
      <ul class="bullets">
        <li>Can&#8217;t find your exact card? Try the card just above or below it &#8212;
        the joke usually still works.</li>
        <li>More than one picture works for your card? Pick the one that reads clearest at
        a small size. That is exactly what you are choosing for.</li>
        <li>Still stuck? <a class="tap-link" href="help.html?topic=finding-images">Ask the
        Help Centre &#8594;</a></li>
      </ul>
    </div>
  </section>

</div>
</main>

{NAV_BOTTOM}

<script src="js/copy.js" defer></script>
</body>
</html>
"""

    OUT_PATH.write_text(html_doc, encoding="utf-8")
    print(f"Wrote {OUT_PATH} — {total_shown} images shown, {excluded} excluded (unverified), "
          f"across {len(ordered_ids)} cards.")


if __name__ == "__main__":
    build()
