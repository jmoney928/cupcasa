---
name: vercel-deploy
description: Deploy all generated sites in the sites/ folder to Vercel using the CLI. Captures live URLs and logs them to the build log.
trigger: "vercel-deploy" or "deploy" or "deploy sites"
---

# Skill: Vercel Deploy

## What This Skill Does
Deploys every site in the `sites/` folder to Vercel using the CLI. Each site gets its own Vercel project and a live URL. All URLs are logged to `sites/build-log.md`.

---

## How to Invoke

```
/vercel-deploy
```
Deploys all sites in the `sites/` folder.

Or deploy a single site:
```
/vercel-deploy zen-nail-bar
```

---

## Prerequisites

Vercel CLI must be installed:
```bash
npm install -g vercel
```

**Local setup:** Run `vercel login` to authenticate via browser.

**Remote / SSH setup:** Add a Vercel token to your `.env` file:
```
VERCEL_TOKEN=your_token_here
```
Get a token at: vercel.com/account/tokens.

Free Vercel Hobby plan supports unlimited static projects. No billing setup needed.

---

## What the Agent Does

You perform this process directly — no external script needed.

### 1. Find all sites to deploy

Look for subfolders in `sites/` that contain an `index.html` file. Skip any folders without one.

### 2. Deploy each site

For each site folder, run:
```bash
vercel deploy --yes --prod sites/{slug}
```

If a `VERCEL_TOKEN` is set in `.env`, add the token flag:
```bash
vercel deploy --yes --prod --token {VERCEL_TOKEN} sites/{slug}
```

### 3. Capture the URL

The deploy command outputs the live URL. Capture it from the output — it will look like `https://{slug}.vercel.app`.

### 4. Wait between deploys

**Always wait 10 seconds between deploying each site.** Vercel rate-limits rapid CLI deploys. Do not skip this delay.

### 5. Update the build log

Append each deployed site to `sites/build-log.md` with the Vercel URL and today's date. The build log format is:

| Business | Slug | Palette | Font | Layout | Vercel URL | Date |
|----------|------|---------|------|--------|------------|------|

### 6. Print summary

After all deploys, print a summary table:

| Business | Old Site | Qualify | Vercel URL |
|----------|----------|---------|------------|
| Zen Nail Bar | zennailbar.com | YES | https://zen-nail-bar.vercel.app |

---

## Deployed URL Pattern

```
https://{business-slug}.vercel.app
```

Examples:
- `https://zen-nail-bar.vercel.app`
- `https://glow-med-spa.vercel.app`

---

## Timing

- Single site deploy: ~10 seconds
- 10 sites: ~2 minutes (with rate-limit delay)
- 50 sites: ~10 minutes

---

## Cost
Free. Vercel Hobby plan. Each site is a single HTML file (~10–15 KB). No build process, no server.
