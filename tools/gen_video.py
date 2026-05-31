import os, sys, time, base64, requests
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.claude', '.env'))

API_KEY = os.getenv('GOOGLE_API_KEY')
if not API_KEY:
    print('ERROR: GOOGLE_API_KEY not set'); sys.exit(1)

KEYFRAME = os.path.join(os.path.dirname(__file__), '..', 'references', 'inputs', 'keyframe.png')
if not os.path.exists(KEYFRAME):
    print(f'ERROR: keyframe not found at {KEYFRAME}'); sys.exit(1)

VIDEO_PROMPT = (
    "Cinematic, photorealistic, slow motion. "
    "The shot opens at eye level — a branded white paper coffee cup sits on damp green forest moss, "
    "logo facing the camera, soft bokeh forest behind it. "
    "The camera slowly arcs upward and tilts down, transitioning from eye-level to a direct overhead bird's-eye view, "
    "as if gently floating up above the cup. "
    "Once overhead, the cup begins to slowly decompose — the walls soften and fold inward, "
    "the paper breaks down and merges with the dark soil and moss beneath it. "
    "The decomposition is slow, graceful, and beautiful — not jarring. "
    "After the cup has completely dissolved and disappeared, fresh bright green grass and tiny moss shoots "
    "push up from the exact spot where the cup stood, filling the frame with new lush growth. "
    "By the final frame, no trace of the cup remains — only a patch of thriving green life. "
    "Soft dappled morning light, hopeful and serene. No humans, no text, no watermark, photorealistic."
)

with open(KEYFRAME, 'rb') as f:
    img_b64 = base64.b64encode(f.read()).decode()

headers = {"Content-Type": "application/json"}

payload = {
    "instances": [{
        "prompt": VIDEO_PROMPT,
        "image": {
            "bytesBase64Encoded": img_b64,
            "mimeType": "image/png"
        }
    }],
    "parameters": {
        "aspectRatio": "16:9",
        "durationSeconds": 8,
        "sampleCount": 1
    }
}

print("Submitting to Veo 2 via Google AI Studio...")
r = requests.post(
    f"https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key={API_KEY}",
    headers=headers, json=payload, timeout=60
)

if not r.ok:
    print(f"Submit error {r.status_code}: {r.text}"); sys.exit(1)

operation = r.json()
op_name = operation.get("name")
print(f"Operation: {op_name} — polling for completion...")

for attempt in range(60):
    time.sleep(10)
    poll = requests.get(
        f"https://generativelanguage.googleapis.com/v1beta/{op_name}?key={API_KEY}",
        headers=headers, timeout=30
    )
    if not poll.ok:
        print(f"Poll error {poll.status_code}: {poll.text}"); continue

    result = poll.json()
    done = result.get("done", False)
    print(f"  [{attempt+1}/60] done: {done}")

    if done:
        if "error" in result:
            print(f"Generation failed: {result['error']}"); sys.exit(1)

        samples = (result.get("response", {})
                         .get("generateVideoResponse", {})
                         .get("generatedSamples", []))
        if not samples:
            print(f"No samples in response: {result}"); sys.exit(1)

        video_uri = samples[0].get("video", {}).get("uri")
        if not video_uri:
            print(f"No video URI in sample: {samples[0]}"); sys.exit(1)

        out_path = os.path.join(os.path.dirname(__file__), '..', 'sites', 'mythos-prints', 'assets', 'hero.mp4')
        print("Downloading video...")
        vr = requests.get(f"{video_uri}&key={API_KEY}", timeout=120)
        with open(out_path, 'wb') as vf:
            vf.write(vr.content)
        print(f"Saved → {os.path.abspath(out_path)}")
        sys.exit(0)

print("Timed out after 10 minutes")
sys.exit(1)
