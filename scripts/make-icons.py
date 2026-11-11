"""Generate the app icons from the chosen design (ICON_05).

Source: _docs/gemini/icon/_CHOOSE_ICON_05.png (2048 px, mark on a lavender
background). Writes into assets/images/. Needs Pillow only.

    python3 scripts/make-icons.py
"""
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_docs" / "gemini" / "icon" / "_CHOOSE_ICON_05.png"
OUT = ROOT / "assets" / "images"
BG = (225, 229, 254)  # lavender background of the design


def mark_mask(img: Image.Image) -> Image.Image:
    """Alpha mask of the mark: distance from the lavender background, softened at the edges."""
    diff = ImageChops.difference(img, Image.new("RGB", img.size, BG)).convert("L")
    return diff.point(lambda v: 0 if v < 10 else min(255, (v - 10) * 14))


def crop_square(img: Image.Image, mask: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Crop to a square around the mark."""
    left, top, right, bottom = mask.getbbox()
    side = max(right - left, bottom - top)
    cx, cy = (left + right) // 2, (top + bottom) // 2
    box = (cx - side // 2, cy - side // 2, cx - side // 2 + side, cy - side // 2 + side)
    return img.crop(box), mask.crop(box)


def placed(mark: Image.Image, canvas: int, fraction: float) -> Image.Image:
    """Mark centred on a transparent canvas, scaled to `fraction` of its width."""
    size = round(canvas * fraction)
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    resized = mark.resize((size, size), Image.LANCZOS)
    out.paste(resized, ((canvas - size) // 2, (canvas - size) // 2), resized)
    return out


def main() -> None:
    src = Image.open(SRC).convert("RGB")
    mask = mark_mask(src)
    mark_rgb, mark_alpha = crop_square(src, mask)
    mark = mark_rgb.convert("RGBA")
    mark.putalpha(mark_alpha)
    # One-colour version: the two dark teal shapes and the dot, so the light
    # wave between them stays visible as a gap
    lum = mark_rgb.convert("L").point(lambda v: 255 if v < 130 else 0)
    r, g, _ = mark_rgb.split()
    dot = ImageChops.subtract(r, g).point(lambda v: 255 if v > 40 else 0)
    solid = ImageChops.multiply(ImageChops.lighter(lum, dot), mark_alpha)
    white = Image.new("RGBA", mark.size, (255, 255, 255, 255))
    white.putalpha(solid)

    # iOS / store icon: the design as drawn, opaque, 1024 px
    src.resize((1024, 1024), Image.LANCZOS).save(OUT / "icon.png")
    # Web favicon
    src.resize((48, 48), Image.LANCZOS).save(OUT / "favicon.png")
    # Android adaptive icon: mark inside the 66 dp safe circle of the 108 dp canvas
    placed(mark, 1024, 0.56).save(OUT / "android-icon-foreground.png")
    Image.new("RGB", (1024, 1024), BG).save(OUT / "android-icon-background.png")
    placed(white, 1024, 0.56).save(OUT / "android-icon-monochrome.png")
    # Splash: the mark alone, shown on the app background colour
    placed(mark, 1024, 0.9).save(OUT / "splash-icon.png")
    # Android notification icon: white silhouette on transparent
    placed(white, 96, 0.92).save(OUT / "notification-icon.png")
    # Google Play store icon: 512 px, opaque
    src.resize((512, 512), Image.LANCZOS).save(ROOT / "_docs" / "app-stores" / "google" / "play-icon-512.png")
    print("Icons written to", OUT)


if __name__ == "__main__":
    main()
