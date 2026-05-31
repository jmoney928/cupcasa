import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

KEYFRAME = os.path.join(os.path.dirname(__file__), '..', 'references', 'inputs', 'keyframe.png')
OUT      = os.path.join(os.path.dirname(__file__), '..', 'references', 'inputs', 'keyframe_logo.png')

base = Image.open(KEYFRAME).convert("RGB")
bw, bh = base.size

# ── LOGO SIZE ─────────────────────────────────────────────────────────────
S  = bw * 0.40 / 140   # scale so logo fills ~40% of image width
lw = int(140 * S)
lh = int(90  * S)

logo = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
d    = ImageDraw.Draw(logo)

lime  = (178, 241, 43,  220)
dark  = (26,  43,  52,  200)
muted = (80,  100, 110, 170)

# M chevron — top-center
ms  = int(28 * S)
mx  = lw // 2 - ms // 2
my  = int(4  * S)
pts = [
    (mx,          my + ms),
    (mx,          my),
    (mx + ms//2,  my + int(ms * 0.55)),
    (mx + ms,     my),
    (mx + ms,     my + ms),
]
stroke = max(2, int(2.5 * S))
for i in range(len(pts) - 1):
    d.line([pts[i], pts[i+1]], fill=lime, width=stroke)

# Dot
dr = max(2, int(3 * S))
dx = mx + ms + int(4 * S)
dy = my + ms - dr
d.ellipse([dx-dr, dy-dr, dx+dr, dy+dr], fill=lime)

# MYTHOS text
try:
    from PIL import ImageFont
    font_big = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", int(18 * S))
    font_sm  = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", int(9  * S))
except Exception:
    font_big = ImageFont.load_default()
    font_sm  = font_big

text_y = my + ms + int(6 * S)
bbox   = d.textbbox((0, 0), "MYTHOS", font=font_big)
tw     = bbox[2] - bbox[0]
d.text(((lw - tw) // 2, text_y), "MYTHOS", font=font_big, fill=dark)

line_y  = text_y + int(24 * S)
margin  = int(10 * S)
d.line([(margin, line_y), (lw - margin, line_y)], fill=lime, width=max(1, int(1.2 * S)))

bbox2 = d.textbbox((0, 0), "P R I N T S", font=font_sm)
tw2   = bbox2[2] - bbox2[0]
d.text(((lw - tw2) // 2, line_y + int(5 * S)), "P R I N T S", font=font_sm, fill=muted)

# ── CYLINDRICAL WARP ──────────────────────────────────────────────────────
# Bows text slightly to follow the cup's cylindrical surface
arr    = np.array(logo, dtype=np.float32)
warped = np.zeros_like(arr)
strength = int(lh * 0.06)   # vertical bow amount

for xi in range(lw):
    nx      = (xi / lw - 0.5) * 2          # -1 … 1
    y_shift = int(strength * (nx ** 2))     # bow down at edges, flat at center
    for yi in range(lh):
        src_y = yi - y_shift
        if 0 <= src_y < lh:
            warped[yi, xi] = arr[src_y, xi]

logo = Image.fromarray(warped.astype(np.uint8), "RGBA")

# ── SLIGHT INK BLEED ──────────────────────────────────────────────────────
logo = logo.filter(ImageFilter.GaussianBlur(radius=max(0.6, S * 0.4)))

# ── OVERLAY BLEND onto cup ────────────────────────────────────────────────
# Overlay preserves cup paper texture + dew drops naturally
px = (bw - lw) // 2
py = int(bh * 0.42) - lh // 2

cup_region = np.array(base.crop((px, py, px + lw, py + lh)), dtype=np.float32)

# Composite logo onto white so transparent = white (no change in overlay)
logo_on_white = np.full((lh, lw, 3), 255, dtype=np.float32)
la = np.array(logo)
alpha = la[:, :, 3:4] / 255.0
logo_rgb = la[:, :, :3].astype(np.float32)
logo_on_white = logo_rgb * alpha + logo_on_white * (1 - alpha)

# Multiply blend at 85% opacity — looks like ink printed on paper
b      = cup_region / 255.0
lg     = logo_on_white / 255.0
mul    = b * lg                          # multiply: darkens where logo is dark
result = b * 0.15 + mul * 0.85          # blend: 85% multiplied, 15% original cup
result = (np.clip(result, 0, 1) * 255).astype(np.uint8)

out_arr         = np.array(base)
out_arr[py:py+lh, px:px+lw] = result
Image.fromarray(out_arr).save(OUT)
print(f"Saved → {OUT}")
