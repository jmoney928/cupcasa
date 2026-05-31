import os, sys, time, base64, requests, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.claude', '.env'), override=True)

API_KEY = os.getenv('WAVESPEED_API_KEY')
if not API_KEY:
    print('ERROR: WAVESPEED_API_KEY not set'); sys.exit(1)

KEYFRAME = os.path.join(os.path.dirname(__file__), '..', '..', 'hotbranded.jpg')
if not os.path.exists(KEYFRAME):
    print(f'ERROR: keyframe not found at {KEYFRAME}'); sys.exit(1)

PROMPT = (
    "Slow cinematic dolly-in toward three Cupcasa-branded white paper coffee cups "
    "on a warm wooden café counter. Soft morning golden light streaming from the left, "
    "long warm shadows. Steam gently rises from the cups. The camera moves slowly forward, "
    "the centre cup's logo coming into sharp focus. Warm bokeh background — "
    "blurred espresso machine, wooden shelves, amber light. "
    "Rich espresso browns, warm caramels, cream whites. "
    "Premium, calm, photorealistic, cinematic. No people, no text overlays."
)

NEGATIVE = "text overlay, watermark, blurry, distorted, low quality, cartoon, people, hands"

print(f"Keyframe: {KEYFRAME}")
with open(KEYFRAME, 'rb') as f:
    img_b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

payload = {
    "image": img_b64,
    "prompt": PROMPT,
    "negative_prompt": NEGATIVE,
    "duration": 8,
    "cfg_scale": 0.6
}

print("Submitting to Kling 3.0 Pro via WaveSpeed...")
r = requests.post(
    "https://api.wavespeed.ai/api/v3/kwaivgi/kling-v3.0-pro/image-to-video",
    headers=headers, json=payload, timeout=60
)

print(f"Status: {r.status_code}")
if not r.ok:
    print(f"Error: {r.text}"); sys.exit(1)

result = r.json()
print(json.dumps(result, indent=2)[:500])

# Get task/prediction ID
# Use the result URL directly from response if available
poll_url = (result.get("data", {}) or {}).get("urls", {}).get("get")
task_id = (result.get("data", {}) or {}).get("id") or result.get("id")
if not task_id:
    print(f"No task ID in response: {result}"); sys.exit(1)

if not poll_url:
    poll_url = f"https://api.wavespeed.ai/api/v3/predictions/{task_id}/result"

print(f"\nTask ID: {task_id}")
print(f"Polling: {poll_url}")
print("Polling for completion (~2–4 minutes)...")

for attempt in range(60):
    time.sleep(8)
    poll = requests.get(poll_url, headers=headers, timeout=30)
    if not poll.ok:
        print(f"Poll error {poll.status_code}: {poll.text}"); continue

    data = poll.json().get("data", poll.json())
    status = data.get("status", "unknown")
    print(f"  [{attempt+1}/60] status={status}")

    if status == "completed":
        outputs = data.get("outputs", [])
        if not outputs:
            print(f"No outputs: {data}"); sys.exit(1)

        video_url = outputs[0] if isinstance(outputs[0], str) else outputs[0].get("url")
        out_path = os.path.join(os.path.dirname(__file__), '..', 'sites', 'cupcasa', 'assets', 'hero.mp4')
        os.makedirs(os.path.dirname(out_path), exist_ok=True)

        print(f"Downloading from {video_url[:60]}...")
        vr = requests.get(video_url, timeout=120)
        with open(out_path, 'wb') as vf:
            vf.write(vr.content)
        print(f"\nSaved → {os.path.abspath(out_path)}")
        sys.exit(0)

    elif status == "failed":
        print(f"Failed: {data}"); sys.exit(1)

print("Timed out after ~8 minutes"); sys.exit(1)
