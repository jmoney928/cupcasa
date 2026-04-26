---
name: beautiful-websites
description: Find local businesses with bad websites, redesign them into premium single-page sites, and deploy them live to Vercel. This is the master skill — it loads the operating rules and runs the 4-step pipeline.
trigger: "beautiful-websites" or "run the pipeline" or "run the beautiful websites pipeline"
---

# Skill: Beautiful Websites

This is the wrapper skill for the Beautiful Websites pipeline. When triggered, load the following two files for full context:

1. **`CLAUDE.md`** (in the kit root) — Your operating rules. Covers the 4 sub-skills, cost rules, key behaviors, file conventions, and preview instructions.
2. **`.agent/workflows/beautiful-websites.md`** — The pipeline workflow. Defines how the 4 skills chain together, what to show at each pause, and the final output format.

Read both files before doing anything else. They contain critical rules about cost approvals, design system usage, and default pause behavior.

## Sub-skills

This pipeline uses 4 sub-skills in sequence:

| Step | Skill | What It Does |
|------|-------|-------------|
| 1 | `/apify-scrape` | Scrapes Google Maps for leads with email + website |
| 2 | `/site-qualify` | Screenshots each site, gives visual YES/NO |
| 3 | `/site-redesign` | Generates a premium single-file HTML site |
| 4 | `/vercel-deploy` | Deploys all sites to Vercel, logs URLs |

Each sub-skill has its own `SKILL.md` in `.agent/skills/` and can be run independently.
