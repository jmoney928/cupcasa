---
name: site-redesign
description: Generate a premium single-file HTML/CSS/JS website redesign for a local business. Uses a mix-and-match design system with 10 palettes, 10 font pairings, and 5 layouts for unlimited unique combinations.
trigger: "site-redesign" or "redesign" or "build site"
---

# Skill: Site Redesign

## What This Skill Does
Takes a local business's existing website content and generates a single `index.html` file that looks like a $5,000+ custom design. No build step. No framework. Deploys instantly to Vercel.

---

## Installation

### Claude Code
Place this file at `.agent/skills/site-redesign/SKILL.md`. Claude Code auto-loads it.

### OpenClaw
Paste the contents of this file into your system prompt. Use the website prompt from `prompts/website_prompt_v1.md` as your generation template.

---

## How to Invoke

```
/site-redesign
```
Reads qualifying leads from `qualify_results.json` automatically and processes all `YES` entries.

Or for a single business:
```
/site-redesign https://zennailbar.com
```

---

## What the Agent Does

For each lead where `qualify === "YES"`:

1. Reads their current website content with `read_url_content`
2. Checks `sites/build-log.md` to avoid repeating a design combo
3. Picks a unique palette + font + layout combination
4. Searches Unsplash for 2–3 photos relevant to the business type
5. Verifies each photo URL loads (200 status) before using it
6. Generates a complete `index.html` using the design system below
7. Saves to `sites/{business-slug}/index.html`
8. Logs the combo used in `sites/build-log.md`

---

## Architecture Rules (NEVER BREAK)

- **One file only** — all CSS in `<style>`, all JS in `<script>`, no separate files
- **No frameworks** — no React, no Vue, no Tailwind build, no npm
- **CDN only** — Google Fonts, GSAP, Lucide Icons
- **No placeholder text** — write real copy from the scraped business data
- **6 sections always** — Navbar, Hero, Services, Philosophy, Contact, Footer
- **Dynamic copyright year** — never hardcode the year. Use `new Date().getFullYear()` in JS to set it

### Required CDN scripts
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>
```

---

## DESIGN SYSTEM

Pick ONE from each column. Never repeat the same combo. Check `sites/build-log.md` first.

---

### COLOR PALETTES

**Dark:**

| Code | Name | Values |
|------|------|--------|
| P1 | Warm Night | `--bg:#080A0C --card:#111518 --accent:#C9A87C --text:#F2EDE8 --muted:#8A8B8D` |
| P2 | Deep Teal | `--bg:#0A1014 --card:#121A1F --accent:#5EADB5 --text:#E8F0F2 --muted:#7A9098` |
| P3 | Noir Plum | `--bg:#0C080E --card:#16111A --accent:#A8748E --text:#F0EBF0 --muted:#8A7E8C` |
| P4 | Slate Ember | `--bg:#0D0E10 --card:#161819 --accent:#C47A4A --text:#ECE8E4 --muted:#8B8985` |
| P5 | Midnight Forest | `--bg:#070B09 --card:#0F1612 --accent:#4CA879 --text:#E8F2EC --muted:#7A8E82` |

**Light:**

| Code | Name | Values |
|------|------|--------|
| P6 | Cream & Sage | `--bg:#F5F1EC --card:#FFFFFF --accent:#5B7A5E --text:#1A1A1A --muted:#6B6B6B` |
| P7 | Blush Editorial | `--bg:#FAFAF8 --card:#FFFFFF --accent:#BF8B8B --text:#2D2D2D --muted:#888888` |
| P8 | Warm Ivory | `--bg:#F8F4EF --card:#FFFDF9 --accent:#B8860B --text:#1C1914 --muted:#7A7468` |
| P9 | Cloud Lavender | `--bg:#F6F4F9 --card:#FFFFFF --accent:#7B68AE --text:#22202A --muted:#7E7A88` |
| P10 | Pearl Marine | `--bg:#F2F6F8 --card:#FFFFFF --accent:#3D7A8A --text:#1A2528 --muted:#6B7E85` |

---

### FONT PAIRINGS

| Code | Sans (Body) | Serif (Display) | Mood |
|------|-------------|-----------------|------|
| F1 | Outfit 300–700 | Cormorant Garamond italic | Elegant luxury |
| F2 | DM Sans 400–700 | Playfair Display italic | Classic editorial |
| F3 | Inter 300–700 | Lora italic | Clean modern |
| F4 | Sora 300–700 | Instrument Serif italic | Tech luxury |
| F5 | Plus Jakarta Sans 300–700 | Fraunces italic | Warm editorial |
| F6 | Manrope 300–700 | Bodoni Moda italic | High fashion |
| F7 | Space Grotesk 400–700 | Crimson Pro italic | Contemporary |
| F8 | Nunito Sans 300–700 | Libre Baskerville italic | Approachable classic |
| F9 | Figtree 300–700 | Noto Serif Display italic | Bold editorial |
| F10 | Rubik 300–700 | EB Garamond italic | Timeless warmth |

**Google Fonts URL pattern:**
```html
<link href="https://fonts.googleapis.com/css2?family=FONT_PARAMS&display=swap" rel="stylesheet">
```

---

### LAYOUTS

| Code | Hero | Cards | Navbar |
|------|------|-------|--------|
| L1 | Content bottom-left | 3-column grid | Pill-shaped floating |
| L2 | Centered text | 2-column zig-zag | Slim top-bar |
| L3 | Split-screen 50/50 | Horizontal divider rows | Full-width thin bar |
| L4 | Center-aligned stack | Full-width horizontal cards | Thin line top |
| L5 | Asymmetric 60/40 | Masonry 2-column | Thick bar, large logo |

---

### PHOTOS (Unsplash — free, dynamic search)

Do NOT use a fixed photo bank. Instead, find photos relevant to each specific business.

**How to find photos:**
1. Determine the business type and category (e.g. nail salon, wedding venue, med spa)
2. Search Unsplash for relevant terms: `https://unsplash.com/s/photos/{search-term}`
3. Pick 2–3 photos that are relevant to what the business actually does
4. Use the direct image URL format: `https://images.unsplash.com/photo-{ID}?w={width}&h={height}&fit=crop&q=80`

**Rules:**
- Photos must be relevant to the business — a nail salon gets nail photos, a wedding venue gets wedding photos
- Use at least 2 photos per site, max 3
- Before using any photo, verify it loads by fetching `https://images.unsplash.com/photo-{ID}?w=400&q=60` and confirming a 200 status (not 404). Unsplash photos can be removed at any time.
- If a photo returns 404, find a replacement — never leave a broken image in the final site
- The hero photo should be high impact and relevant to the business atmosphere

---

## QUALITY STANDARDS (always applied)

- GSAP scroll-triggered fade-up animations on all sections
- Noise texture overlay (`opacity: 0.04` dark / `0.02` light)
- Magnetic button hover (`scale(1.03)`, `translateY(-1px)`)
- Responsive at 375px mobile and 1440px desktop
- Clickable `tel:` and `mailto:` links
- Navbar transitions on scroll

### JS Safety — prevent invisible cards
```css
/* Always include this */
.service-card { opacity: 1 !important; }
```
```js
// Always init Lucide before GSAP
try { lucide.createIcons(); } catch(e) {}
gsap.registerPlugin(ScrollTrigger);
```

---

## Output

- File: `sites/{business-slug}/index.html`
- Log entry appended to: `sites/build-log.md`

**Slug format:** lowercase, hyphenated. `Zen Nail Bar` → `zen-nail-bar`
