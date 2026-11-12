"""Lay screenshots out in a grid with their names: contact-sheet.py OUT.png IMG..."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

out, files = sys.argv[1], sys.argv[2:]
W = 360
ims = []
for f in files:
    im = Image.open(f).convert("RGB")
    ims.append((Path(f).stem, im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)))
cols = min(5, len(ims))
rows = (len(ims) + cols - 1) // cols
H = max(i.height for _, i in ims) + 24
sheet = Image.new("RGB", (cols * (W + 8), rows * H), "white")
d = ImageDraw.Draw(sheet)
for n, (name, im) in enumerate(ims):
    x, y = (n % cols) * (W + 8), (n // cols) * H
    sheet.paste(im, (x, y + 22))
    d.text((x + 4, y + 4), name, fill="black")
sheet.save(out)
