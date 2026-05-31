import os, sys, base64, requests
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.claude', '.env'))

API_KEY = os.getenv('GOOGLE_API_KEY')
if not API_KEY:
    print('ERROR: GOOGLE_API_KEY not set'); sys.exit(1)

PROMPT = (
    "Ultra-realistic product photograph, Canon R5, 85mm f/2.0. A premium white paper coffee cup "
    "sits on damp green forest moss. The cup fills 65 percent of the frame. "
    "Printed on the cup face: a minimal brand logo. "
    "At the top: a chartreuse lime-green M letterform — two tall vertical strokes with a V-shaped dip meeting in the center, "
    "like the letter M drawn in clean line-weight strokes, with a small filled lime-green circle dot to its immediate right. "
    "Directly below the M: the word MYTHOS in large bold dark-navy sans-serif capital letters. "
    "Below that: a thin horizontal lime-green rule line stretching across the logo width. "
    "Below that: the word PRINTS in small widely-spaced dark grey sans-serif capital letters. "
    "The entire logo is screen-printed directly onto the white paper cup surface — it has the matte, "
    "slightly textured look of professional ink on paper cup stock. "
    "Blurred green forest bokeh background. Soft natural daylight, slight morning dew on the cup exterior. "
    "Photorealistic, no extra text, no people. 16:9 landscape."
)

url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={API_KEY}"
payload = {
    "instances": [{"prompt": PROMPT}],
    "parameters": {"sampleCount": 1, "aspectRatio": "16:9"}
}

print("Generating keyframe image with Imagen 3 (Nano Banana Pro)...")
r = requests.post(url, json=payload, timeout=120)
r.raise_for_status()

data = r.json()
img_b64 = data["predictions"][0]["bytesBase64Encoded"]
out_path = os.path.join(os.path.dirname(__file__), '..', 'references', 'inputs', 'keyframe.png')
with open(out_path, 'wb') as f:
    f.write(base64.b64decode(img_b64))

print(f"Saved → {os.path.abspath(out_path)}")
