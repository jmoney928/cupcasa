---
name: apify-scrape
description: Scrape Google Maps for local business leads filtered to those with both an email and a website.
trigger: "apify-scrape" or "scrape leads" or "find leads"
---

# Skill: Apify Scrape

## What This Skill Does
Queries Google Maps via Apify and returns a filtered list of local businesses that have both a discoverable email address and a website. Output is saved to `scrape_results.json`.

---

## How to Invoke

```
/apify-scrape nail salons in Austin TX
```
or
```
Scrape leads for nail salons in Austin TX
```

You can also pass options:
```
/apify-scrape nail salons in Austin TX --max 30
/apify-scrape plumbers in Melbourne --country AU
```

### Parsing the input

The user will say something like "nail salons in Austin TX" or "plumbers in Melbourne". You must split this into two parts:

- **Search query** — the business type only (e.g. "nail salons", "plumbers")
- **Location** — the city/region (e.g. "Austin TX", "Melbourne")

These go into separate Apify fields. Do NOT put the full string into `searchStringsArray` — that causes incorrect geo-targeting.

If the user includes `--country XX` (e.g. `--country AU`), use it as the `countryCode`. This is important for cities that exist in multiple countries (e.g. Melbourne exists in both Australia and Florida). If no country is specified, infer from context — the city name, prior conversations, or what you know about the user's location. If you're unsure, ask before running the scrape.

---

## What the Agent Does

You perform this entire process directly — no external script needed. Just make the API calls yourself.

**Required:** `APIFY_TOKEN` must be set in `.env`. Read it before starting.

### 1. Start an Apify run

Make a POST request to:
```
https://api.apify.com/v2/acts/lukaskrivka~google-maps-with-contact-details/runs?token={APIFY_TOKEN}
```

With this JSON body:
```json
{
  "searchStringsArray": ["{search query — business type only, e.g. nail salons}"],
  "locationQuery": "{location — city/region only, e.g. Austin TX}",
  "countryCode": "{country code, e.g. us, au, gb — infer from context or ask}",
  "maxCrawledPlacesPerSearch": {max, default 20},
  "language": "en",
  "maxImages": 0,
  "maxReviews": 0
}
```

### 2. Poll for completion

Every 8 seconds, check the run status:
```
GET https://api.apify.com/v2/actor-runs/{runId}?token={APIFY_TOKEN}
```

Wait until `status` is `SUCCEEDED`. If it's `FAILED`, `ABORTED`, or `TIMED-OUT`, stop and tell the user.

### 3. Download results

Get the dataset ID from the completed run, then download:
```
GET https://api.apify.com/v2/datasets/{datasetId}/items?token={APIFY_TOKEN}&format=json&clean=true
```

### 4. Filter and normalize

From the raw results, keep only items that have:
- A `website` field (not empty)
- At least one entry in the `emails` array
- A website that is NOT a Facebook, Yelp, or Instagram page
- A business name that is NOT a national chain (Supercuts, Great Clips, Regis, Sport Clips, Fantastic Sams, Hair Cuttery, Drybar, Holiday Inn, Marriott, Hilton, Hyatt, Wyndham, Best Western)

**Important field mapping:** The Apify actor returns:
- `emails` — an array. Use `emails[0]` as the lead's email.
- `website` — a string. Use as-is.
- `phones` — an array. Use `phones[0]` as the lead's phone.
- `title` — the business name.
- `address` — full address string.
- `totalScore` — rating (e.g. 4.7).
- `reviewsCount` — number of reviews.
- `categoryName` — business category.

### 5. Save output

Save the filtered leads to `scrape_results.json` as an array of objects:
```json
[
  {
    "name": "Zen Nail Bar",
    "email": "owner@zennailbar.com",
    "website": "https://zennailbar.com",
    "phone": "+1-512-555-0123",
    "address": "1234 Main St, Austin, TX 78701",
    "rating": 4.7,
    "reviewCount": 142,
    "category": "Nail salon"
  }
]
```

### 6. Report back

Tell the user how many leads were found. List each lead in a table with **name, website URL (clickable), and email** so the user can easily inspect each site before moving on.

---

## Good Niches
Nail salons · Med spas · Hair salons · Massage studios · Wedding venues · Boutique hotels

---

## If Results Are Thin

If the scrape returns fewer usable leads than expected, suggest these options to the user and let them decide:

- **Increase max results** — cast a wider net (e.g. max 50 instead of 20)
- **Broaden the location** — try the wider metro area instead of a specific suburb
- **Try a different niche** — some niches have more businesses with discoverable emails than others
- **Reuse a previous run** — you can re-download results from a previous Apify run ID without paying again. Use `GET /v2/actor-runs/{runId}` to get the dataset ID, then `GET /v2/datasets/{datasetId}/items` to download results.

---

## Cost
$4.00 per 1,000 places scraped. Before running, always tell the user: "I'm about to scrape [X] places, which will cost approximately $[Y]. OK to proceed?" Never run without explicit approval.
