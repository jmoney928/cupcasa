---
name: site-qualify
description: Screenshot each business website using Playwright, then visually assess it to return a binary YES/NO on whether it's worth redesigning.
trigger: "site-qualify" or "qualify leads" or "qualify websites"
---

# Skill: Site Qualify

## What This Skill Does
Takes a full-page screenshot of each business website, then assesses the screenshot visually to decide if the site is bad enough to be worth redesigning. Returns YES or NO per lead.

This is **two steps combined into one skill:**
1. Screenshot (Playwright — free, runs locally)
2. Visual assessment (Claude reads the image directly — no API key needed)

---

## Installation

### Claude Code
Place this file at `.agent/skills/site-qualify/SKILL.md`. Claude Code auto-loads it and can read screenshot images directly using its vision capability.

### OpenClaw
Paste the contents of this file into your system prompt. For the screenshot step, run `scripts/screenshot.js` manually, then share the image with Claude for assessment.

---

## How to Invoke

```
/site-qualify
```
Reads from `scrape_results.json` automatically.

Or for a single URL:
```
/site-qualify https://example.com
```

---

## What the Agent Does

### 0. Deduplicate against previous runs

Before processing any leads, read `sites/build-log.md`. If a business name or website URL already appears in the build log, skip it — it was already redesigned and deployed in a previous run. Mark it as `SKIP` with reason "already in build log" and do not screenshot it.

### For each remaining lead in `scrape_results.json`:

1. Runs `node scripts/screenshot.js` to capture a PNG of the website
2. Reads the PNG image directly
3. Applies the qualification criteria below
4. Returns `YES`, `NO`, or `SKIP` with a one-line reason
5. Saves output to `qualify_results.json`

---

## Script Reference

**File:** `scripts/screenshot.js`

```bash
# Single site
node scripts/screenshot.js --url https://example.com --out screenshots/example.png

# The skill handles batch automatically via qualify_results loop
```

**Requirements:**
```bash
npm install playwright
npx playwright install chromium
```

No API key. No cost.

---

## Qualification Criteria

The bar is HIGH. The question is not "is this site broken?" — it's "does this site look like a premium, custom-designed experience?" Most local business sites will be a YES.

A site scores **YES** (worth redesigning) if it shows **any** of these signals:

| Signal | Examples |
|--------|---------|
| Outdated visual design | Table layouts, clip art, beveled buttons, tiled backgrounds |
| Pre-2015 aesthetic | Text drop shadows, gradients on everything, marquee text |
| No mobile responsiveness | Fixed-width, horizontal scrollbar visible |
| Basic or flat typography | Only one font, no contrast between headings and body, generic system fonts, no personality in the type |
| No clear hero or CTA | Wall of text, no button above the fold |
| Cluttered layout | Too many elements competing, no visual hierarchy |
| Low-quality or missing imagery | Few photos, broken images, stock photos, no lifestyle or atmosphere shots |
| Trust-eroding signals | `http://` only, copyright pre-2018, "under construction" notice |
| Template look | Wix ADI, GlossGenius, Setmore, basic Squarespace — looks like a default theme with content swapped in |
| Bland buttons or navigation | Plain rectangular buttons, basic text links, no hover effects, no visual flair in the nav |
| Lacks premium feel | The site is "fine" but feels generic — no distinct brand personality, no rich visuals, no animations or polish |

A site scores **NO** (skip) ONLY if it meets ALL of these:
- Custom or high-end design that feels like real money was spent on it
- Rich, high-quality photography throughout
- Distinctive typography with clear font pairing (display + body fonts)
- Smooth interactions, animations, or transitions
- Strong brand personality — you can tell this isn't a template

---

## Output Format

`qualify_results.json`:
```json
[
  {
    "name": "Zen Nail Bar",
    "email": "owner@zennailbar.com",
    "website": "https://zennailbar.com",
    "qualify": "YES",
    "reason": "Fixed-width layout, clip art graphics, no CTA, copyright 2011.",
    "screenshotPath": "screenshots/zen-nail-bar.png"
  },
  {
    "name": "Modern Nails Studio",
    "email": "info@modernnails.com",
    "website": "https://modernnails.com",
    "qualify": "NO",
    "reason": "Clean modern design with clear booking CTA and responsive layout.",
    "screenshotPath": "screenshots/modern-nails-studio.png"
  }
]
```

---

## Notes
- Playwright launches a headless Chromium browser — no visible window opens
- Screenshots are saved to `screenshots/{slug}.png`
- If a site fails to load (timeout, SSL error), it is marked `qualify: "ERROR"` and skipped
- Only leads with `qualify: "YES"` proceed to the site-redesign skill
