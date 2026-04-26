# Beautiful Websites Agent Kit

**Find local businesses with bad websites. Redesign them. Deploy them. Use them as proof.**

A 4-skill pipeline that runs inside Claude Code, Antigravity, or OpenClaw. Point it at a niche and city, and it returns live Vercel URLs of redesigned business websites ready to pitch back to the owners.

---

## Setup

### Step 1: Determine your environment

- **Claude Code** — you are running inside a terminal/IDE and have a working directory. You auto-load `CLAUDE.md` files.
- **Antigravity** — you are running inside Google Antigravity, an agentic IDE. You have access to the editor, terminal, and browser.
- **OpenClaw** — you are running inside an OpenClaw agent workspace. You use `AGENTS.md`, `TOOLS.md`, and load skills from a `skills/` folder.

If you are none of the above, tell the user what environment you are and ask how to proceed.

### Step 2: Read the docs

Before installing anything, read these two files completely:

- **CLAUDE.md** — Your operating rules for this kit. Covers the 4 skills, cost rules, key behaviors, and file conventions.
- **.agent/workflows/beautiful-websites.md** — The pipeline workflow. Defines how the 4 skills chain together, what to show at each pause, and the final output format.

These contain critical rules about cost approvals and default behaviors. Do not skip them.

### Step 3: Install into your environment

**If you are Claude Code:**

1. Place the kit folder in your working directory and `cd` into it.
2. `CLAUDE.md` auto-loads. Skills and workflows auto-load from `.agent/`. You're ready.

**If you are Antigravity:**

1. Open the kit folder as your workspace in Antigravity.
2. Read `CLAUDE.md` — it contains all the operating rules, cost rules, and skill definitions for this kit. Treat it as your instruction file.
3. Read `.agent/workflows/beautiful-websites.md` for the pipeline workflow.
4. Read each skill file in `.agent/skills/` so you know how to run each step.
5. All file paths in the kit are relative to the kit folder. Always operate from the kit folder as your working directory.

**If you are OpenClaw:**

1. **Place the kit folder** in a location that makes sense for your setup. If unsure, ask the user.
2. **Install the skills.** Copy the skill folders from the kit into your workspace's `skills/` directory:
   ```bash
   cp -r /path/to/beautiful-websites-kit/.agent/skills/* <your-workspace>/skills/
   ```
   Replace the paths with your actual locations. OpenClaw's file watcher will pick up the new skills automatically.
3. **Set the working directory.** All file paths in the skills (scripts, data files, build logs) are relative to the kit folder. When running this pipeline, always operate from the kit folder as your working directory.

The kit includes a wrapper skill (`beautiful-websites/SKILL.md`) that loads the operating rules and workflow when triggered. The 4 sub-skills (`apify-scrape`, `site-qualify`, `site-redesign`, `vercel-deploy`) are also copied and can be used independently.

### Step 4: Install dependencies

The kit requires **Node.js 18+**, **Playwright with Chromium**, and the **Vercel CLI**. Install them from inside the kit folder. On Linux, also install Playwright's system-level dependencies for Chromium. If anything fails, stop and tell the user the exact error.

### Step 5: Configure API keys

Copy `.env.example` to `.env`, then ask the user for:

1. **APIFY_TOKEN** (required) — "I need your Apify API token. You can find it at apify.com → Settings → Integrations."
2. **VERCEL_TOKEN** (only for remote/SSH setups) — "Are you on a local machine or a remote server? If remote, I'll need a Vercel token from vercel.com/account/tokens."

If the user says local, skip the Vercel token and run `vercel login` instead. Never expose these keys.

### Step 6: Verify and confirm

Confirm that Node.js, Playwright, and the Vercel CLI are all installed and working. If everything checks out, tell the user:

"Setup complete. The Beautiful Websites kit is installed. I now have 4 new skills: apify-scrape, site-qualify, site-redesign, and vercel-deploy. These chain together as a pipeline to find businesses with bad websites, redesign them, and deploy them live. What niche and city would you like me to target?"

If anything failed, tell the user exactly what went wrong.

---

## How It Works

```
/apify-scrape → /site-qualify → /site-redesign → /vercel-deploy
```

| Skill | What It Does | Cost |
|-------|-------------|------|
| `/apify-scrape` | Scrapes Google Maps for businesses with email + website | $4 per 1,000 places |
| `/site-qualify` | Screenshots each site, Claude assesses YES/NO visually | Free |
| `/site-redesign` | Generates a premium single-file HTML site | Free |
| `/vercel-deploy` | Deploys each site to Vercel, captures live URL | Free |

---

## Running the Pipeline

### Default (with review pauses — recommended)

```
Run the beautiful websites pipeline for nail salons in Austin TX
```

The agent pauses after each step, shows you the results, and waits for your approval before continuing. This is the default because the scrape step costs money and the qualify step is subjective.

### Automatic (no pauses)

```
Run the beautiful websites pipeline for nail salons in Austin TX --auto
```

Runs all 4 steps back-to-back. Only use this when you're confident in the pipeline.

### Run skills individually

```
/apify-scrape nail salons in Austin TX
/site-qualify
/site-redesign
/vercel-deploy
```

---

## Previewing Sites Before Deploy

**Local machine:** Open `sites/{slug}/index.html` directly in your browser.

**Remote / SSH setup:** Start a temporary web server:
```bash
cd sites && python3 -m http.server 8080 --bind 127.0.0.1
```
Then visit `http://localhost:8080/{slug}/` in your browser. VS Code Remote SSH will auto-forward the port.

---

## File Structure

```
beautiful-websites-kit/
├── CLAUDE.md                          # Agent brain (auto-loaded in Claude Code, read manually in Antigravity)
├── README.md                          # This file
├── .env.example                       # API key template
├── package.json
├── .agent/
│   ├── workflows/
│   │   └── beautiful-websites.md      # Pipeline workflow
│   └── skills/
│       ├── beautiful-websites/SKILL.md # Wrapper skill (loads rules + workflow)
│       ├── apify-scrape/SKILL.md      # Skill 1: Scrape leads
│       ├── site-qualify/SKILL.md      # Skill 2: Screenshot + qualify
│       ├── site-redesign/SKILL.md     # Skill 3: Generate site
│       └── vercel-deploy/SKILL.md     # Skill 4: Deploy
├── scripts/
│   └── screenshot.js                  # Playwright screenshotter
├── prompts/
│   └── website_prompt_v1.md           # Website generation prompt template
└── sites/
    └── build-log.md                   # Tracks design combos + Vercel URLs
```

---

## Good Niches to Target

Businesses that care about design and have budget to pay for it:

- Nail salons
- Med spas & Botox clinics
- Hair salons & barbershops
- Massage & wellness studios
- Wedding venues & planners
- Boutique hotels / B&Bs

**Avoid:** National chains, franchises, restaurants (razor-thin margins), lawyers (already have agencies).

---

## Design System

The `site-redesign` skill uses a mix-and-match design system:

- **10 color palettes** (5 dark, 5 light)
- **10 font pairings** (sans + serif combos)
- **5 layout flavors** (hero, cards, navbar variations)

Photos are sourced dynamically from Unsplash based on the business type — no fixed photo bank. Every site looks unique. The build log tracks what's been used so combinations are never repeated.

---

## Troubleshooting

**Screenshots fail or show blank pages:**
- Run `npx playwright install-deps chromium` to install system dependencies
- Some sites load content dynamically as you scroll — the screenshot script handles this with multiple scroll passes, but very slow sites may still appear incomplete

**Scrape returns 0 usable leads:**
- The script filters for businesses with both a website AND a discoverable email — this is strict
- Try increasing `--max` (e.g. `--max 50`) to cast a wider net
- Try a broader location (metro area instead of suburb)
- You can re-download results from a previous Apify run without paying again

**Deploy fails with "no credentials":**
- Run `vercel login` (local) or add `VERCEL_TOKEN` to your `.env` (remote/SSH)

**Node.js errors about imports or parseArgs:**
- You need Node.js 18+. Check with `node --version`

---

## FAQ

**Do I need an Anthropic API key?**
No. Claude does the qualification and redesign directly through conversation. No separate API calls.

**Can I run this without Claude Code?**
Yes. Use Antigravity or OpenClaw. In Antigravity, open the kit folder and read `CLAUDE.md` as your rules file. In OpenClaw, copy the skills into your workspace's `skills/` folder and set the kit folder as your working directory.

**How long does a full batch take?**
- Scrape: 2–5 minutes
- Screenshot + qualify 10 sites: ~3 minutes
- Redesign 5 sites: ~15 minutes
- Deploy 5 sites: ~2 minutes
- **Total: ~25 minutes for 5 qualifying leads**

**Is Vercel really free?**
Yes. The Hobby plan is free and supports unlimited projects. Each site is one HTML file (~10–15 KB).
