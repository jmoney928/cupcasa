---
description: Beautiful websites pipeline — 4 skills, run in sequence
---

# Beautiful Websites Workflow

## Overview

Four skills. Run them in order. At the end you have a list of local businesses, each with a live Vercel URL showing their redesigned site — ready to use as proof-of-work in outreach.

```
/apify-scrape → /site-qualify → /site-redesign → /vercel-deploy
```

---

## How to Run

### Full pipeline (default — with review pauses)
```
Run the beautiful websites pipeline for [NICHE] in [CITY, STATE]
```

Claude pauses after each skill, shows results, and waits for your go-ahead before continuing. This is the default because the scrape step costs money and the qualify step is subjective — you should review both before proceeding.

### Full pipeline (automatic — no pauses)
```
Run the beautiful websites pipeline for [NICHE] in [CITY, STATE] --auto
```

Claude runs all 4 skills back-to-back without stopping. Only use this when you're confident in the pipeline and don't need to review intermediate results.

### Individual skills
```
/apify-scrape nail salons in Austin TX
/site-qualify
/site-redesign
/vercel-deploy
```

---

## Step 1 — `/apify-scrape`

**Skill:** `.agent/skills/apify-scrape/SKILL.md`

**Input:** niche + city from user
**Output:** `scrape_results.json`

Queries Google Maps via Apify. Filters to businesses with both an email and a website. Skips national chains.

> **Pause:** Show count and list of leads found (name, website, email for each). Ask: "Proceed to qualify?"

---

## Step 2 — `/site-qualify`

**Skill:** `.agent/skills/site-qualify/SKILL.md`

**Input:** `scrape_results.json`
**Output:** `qualify_results.json`

Screenshots each website with Playwright, then visually assesses the screenshot to return YES or NO. Only YES leads continue to the next step.

> **Pause:** Show the YES/NO breakdown with reasons. Ask: "Proceed to redesign?"

---

## Step 3 — `/site-redesign`

**Skill:** `.agent/skills/site-redesign/SKILL.md`

**Input:** `qualify_results.json` (YES leads only)
**Output:** `sites/{slug}/index.html` per lead + `sites/build-log.md`

Scrapes current site content, picks a unique design combo (palette + font + layout), generates a premium single-file HTML site. Never repeats a combo — checks build-log first.

> **Pause:** Describe each site built (design choices, key content). Explain how to preview. Ask: "Deploy these?"

---

## Step 4 — `/vercel-deploy`

**Skill:** `.agent/skills/vercel-deploy/SKILL.md`

**Input:** `sites/` folder
**Output:** live Vercel URLs logged to `sites/build-log.md`

Deploys each site folder with `vercel deploy --yes --prod`. Captures URLs. Includes 10-second delay between deploys to avoid rate limits.

---

## Final Output

After Step 4, print a summary table:

| Business | Old Site | Qualify | Vercel URL |
|----------|----------|---------|------------|
| Zen Nail Bar | zennailbar.com | YES | https://zen-nail-bar.vercel.app |
| City Nails | citynails.net | NO — modern site | — |
| Glow Studio | glowstudio.com | YES | https://glow-studio.vercel.app |

---

## Pause Behavior

**Default (no flag):** Pause after each step:

1. After scrape → show lead count + list (name, website, email)
2. After qualify → show YES/NO breakdown with reasons
3. After redesign → describe each site built, explain how to preview
4. After deploy → show final summary table

**With `--auto`:** Skip all pauses and print the summary at the end only. Only use when the user explicitly requests it.
