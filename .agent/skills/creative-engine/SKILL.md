---
name: creative-engine
description: Orchestrate AI image and video generation to create visual ad content at scale — UGC-style to cinematic brand content — using Airtable as the review hub. Supports Nano Banana (images), Veo 3.1 / Kling 3.0 / Sora 2 Pro (videos), with multi-provider routing via Google AI Studio, Kie AI, and WaveSpeed AI.
trigger: "creative-engine" or "generate content" or "generate ads" or "create videos" or "create images" or "generate-content"
---

# Skill: Creative Engine

## What This Skill Does

Generates AI ad images and videos at scale for a product. The workflow:
1. Optionally analyze reference videos to extract style and tone
2. Write image prompts → create Airtable records → generate images → user reviews in Airtable
3. Write video prompts → generate videos from approved images → user reviews in Airtable

**All outputs go to Airtable only — no local downloads.**

---

## How to Invoke

```
/creative-engine
```
or
```
Generate ads for [product name]
```

---

## Setup (First Time Only)

```bash
pip install -r .claude/requirements.txt
```

Copy `.claude/.env.example` to `.claude/.env` and fill in:
- `GOOGLE_API_KEY` — [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (images + Veo 3.1)
- `KIE_API_KEY` — [kie.ai/api-key](https://kie.ai/api-key) (Kling/Sora + fallback image gen + file hosting)
- `WAVESPEED_API_KEY` (optional) — [wavespeed.ai](https://wavespeed.ai) (backup video provider)
- `AIRTABLE_API_KEY` — Airtable PAT with `data.records:read/write`, `schema.bases:read/write`
- `AIRTABLE_BASE_ID` — from the Airtable base URL (`appXXXXXX`)

Create the Airtable table:
```bash
python .claude/setup_airtable.py
```

---

## Provider & Model Reference

| Model | Default Provider | Also Available | Use Case |
|-------|-----------------|----------------|----------|
| Nano Banana | Google AI Studio | Kie AI | Fast image gen |
| Nano Banana Pro | Google AI Studio | Kie AI | High-quality image gen |
| Veo 3.1 | Google AI Studio | — | Authentic video (native audio/dialogue) |
| Kling 3.0 | Kie AI | WaveSpeed AI | Cinematic video |
| Sora 2 Pro | Kie AI | WaveSpeed AI | High-quality video |

---

## Cost Reference (per unit)

| Model | Provider | Cost |
|-------|----------|------|
| Nano Banana | Google | ~$0.04 |
| Nano Banana | Kie AI | $0.09 |
| Nano Banana Pro | Google | ~$0.13 |
| Nano Banana Pro | Kie AI | $0.09 |
| Veo 3.1 | Google | ~$0.50 |
| Kling 3.0 | Kie AI | ~$0.30 |
| Kling 3.0 | WaveSpeed | ~$0.30 |
| Sora 2 Pro | Kie AI | ~$0.30 |
| Sora 2 Pro | WaveSpeed | ~$0.30 |

**HARD RULE: Never call any generation endpoint without first showing the exact cost breakdown and receiving explicit user confirmation.**

---

## What the Agent Does

### Step 0 (Optional): Analyze Reference Videos

If the user provides reference videos in `references/inputs/`, analyze them before writing prompts:

```python
import sys; sys.path.insert(0, '.')
from tools.video_analyze import analyze_video, analyze_multiple

analysis = analyze_video("references/inputs/reference_ad.mp4")
print(analysis["summary"])
```

Show the analysis summary to the user and confirm the style direction before proceeding.

---

### Step 1: Gather Inputs

Ask the user for:
1. **Product name**
2. **Reference images** — confirm they're in `references/inputs/`
3. **Number of ad variations**
4. **Style/mood preferences** (UGC vs cinematic, aspect ratio, character details, etc.)
5. **Image model** (default: Nano Banana Pro via Google AI Studio)

---

### Step 2: Write Prompts & Create Airtable Records

Upload reference images to Kie.ai first (reuse URLs — they expire after 3 days):

```python
import sys; sys.path.insert(0, '.')
from tools.kie_upload import upload_references

ref_urls = upload_references(["references/inputs/product.jpg"])
```

Create Airtable records with prompts AND reference images attached:

```python
from tools.airtable import create_records_batch, get_next_index

start_index = get_next_index()  # ensures unique Index across batches
records = create_records_batch([
    {
        "Index": start_index,
        "Ad Name": "ProductName - Variation 1",
        "Product": "Product Name",
        "Reference Images": [{"url": ref_urls[0]}],
        "Image Prompt": "9:16. A person holding [product] ...",
        "Image Model": "Nano Banana Pro",
        "Image Status": "Pending",
    },
    # ... more variations (increment Index)
])
```

**Tell the user to review prompts in Airtable.** Wait for confirmation before generating.

#### Image Prompt Guidelines
- Start with aspect ratio: `9:16.`
- Describe a realistic person holding/using the product
- Reference the input: `Using input image 1 for product identity.`
- UGC style: casual, selfie-angle, natural lighting, authentic

---

### Step 3: Cost Confirmation & Generate Images

**STOP — show cost and wait for explicit confirmation before calling any API.**

```python
from tools.airtable import get_pending_images
from tools.image_gen import generate_batch

records = get_pending_images()
results = generate_batch(records, reference_paths=["references/inputs/product.jpg"])
# Override provider: generate_batch(records, reference_paths=[...], provider="kie")
```

Tell the user to review images in Airtable and mark as "Approved" or "Rejected".

---

### Step 4: Write Video Prompts (only after image approval)

Only proceed when the user explicitly says to continue with videos.

**Pay attention to image selection:**
- "use Image 1" → `preferred_image=1`, `num_variations=1`
- "use Image 2" → `preferred_image=2`, `num_variations=1`
- "use both" → `num_variations=2` (default)

```python
from tools.airtable import update_record

# Veo 3.1 — natural description with dialogue in quotes:
update_record(record_id, {
    "Video Prompt": 'A young woman holds up the product and says "okay so this actually works," she turns it to show the label. Fixed camera, iPhone selfie, warm natural daylight, casual excited tone.',
    "Video Model": "Veo 3.1",
    "Video Status": "Pending",
})

# Kling 3.0 / Sora 2 Pro — structured format:
update_record(record_id, {
    "Video Prompt": "dialogue: okay so this actually works...\naction: holds up product, turns to show label\ncamera: fixed camera, no music, iPhone selfie\nemotion: excited, genuine\nvoice_type: casual, friendly, young adult female",
    "Video Model": "Kling 3.0",
    "Video Status": "Pending",
})
```

Tell the user to review video prompts in Airtable. **Wait for confirmation before generating.**

---

### Step 5: Provider Selection, Cost Confirmation & Generate Videos

For Kling/Sora, ask the user which provider: **Kie AI** (default) or **WaveSpeed AI** (backup).

**STOP — show cost and wait for explicit confirmation.**

```python
from tools.airtable import get_pending_videos
from tools.video_gen import generate_batch

pending = get_pending_videos()
results = generate_batch(pending, num_variations=2)
# WaveSpeed override: generate_batch(pending, num_variations=2, provider="wavespeed")
# Single image: generate_batch(pending, preferred_image=1, num_variations=1)
```

---

## Airtable Table Schema

| Field | Type | Purpose |
|-------|------|---------|
| Index | Number | Unique row number (auto-incremented) |
| Ad Name | Text | Identifier |
| Product | Text | Product name |
| Reference Images | Attachment | Product photos |
| Image Prompt | Long Text | Prompt for image generation |
| Image Model | Select | Nano Banana / Nano Banana Pro |
| Image Status | Select | Pending / Generated / Approved / Rejected |
| Generated Image 1 | Attachment | AI image variation 1 |
| Generated Image 2 | Attachment | AI image variation 2 |
| Video Prompt | Long Text | Motion prompt |
| Video Model | Select | Kling 3.0 / Sora 2 Pro / Veo 3.1 |
| Video Status | Select | Pending / Generated / Approved / Rejected |
| Generated Video 1 | Attachment | Final video variation 1 |
| Generated Video 2 | Attachment | Final video variation 2 |

---

## Key Rules

- **Records first, review in Airtable, then generate** — never generate without Airtable records first
- **Images before videos** — never skip ahead
- **Cost confirmation is mandatory** before every generation batch — confirm images and videos separately
- **2 variations per record by default** — but 1 if the user picks a single image
- **All outputs to Airtable only** — no local downloads
- **Reference images expire** from Kie.ai after 3 days — re-upload if needed
- **Always use `sys.path.insert(0, '.')` before importing `tools` modules**
- **Always call `get_next_index()`** before creating records to avoid duplicate Index values

---

## File Structure

```
.claude/
  .env                - API keys (gitignored)
  .env.example        - Template
  requirements.txt    - Python dependencies
  setup_airtable.py   - One-time Airtable setup
references/
  inputs/             - Product images and reference videos
  docs/
    prompt-best-practices.md
tools/
  airtable.py         - Airtable CRUD
  kie_upload.py       - Upload references to Kie.ai
  image_gen.py        - Multi-provider image generation
  video_gen.py        - Multi-provider video generation
  video_analyze.py    - Reference video analysis via Gemini
  providers/          - google.py, kie.py, wavespeed.py
```
