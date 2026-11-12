#!/usr/bin/env python3
"""
Turns walkthrough captures into store screenshots: a localized caption over
the real screen in a phone frame, at a size each store accepts.

    python3 e2e/walkthrough/store-screenshots.py

Reads walkthrough-output/{ios,ios-pt,ios-es,android,android-pt,android-es}
(the latest run of each; see run.sh) and writes
store-screenshots/{apple,google}/{en,pt,es}/NN-scene.png (git-ignored).

- Apple: 1320 x 2868 (the 6.9" set; App Store Connect scales it to every
  smaller iPhone). Record on an iPhone 17 Pro Max simulator.
- Google Play: 1080 x 1920 (9:16; the long side may be at most twice the
  short side, so a raw 1080 x 2424 capture is refused).

Captions are the localized overlay lines of _docs/app-stores/assets-checklist.md.
Needs Pillow. Fonts: Fraunces and DM Sans (SIL OFL), as on diary.eleva.care.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
CAPTURES = ROOT / "walkthrough-output"
OUT = ROOT / "store-screenshots"
FONTS = HERE / "fonts"

STORES = {
    "apple": {"platform": "ios", "size": (1320, 2868)},
    "google": {"platform": "android", "size": (1080, 1920)},
}

# Scene: capture name and caption per language. Every capture is recorded in
# all three languages on both platforms (run.sh, l-screens.yaml for Android).
SCENES = [
    ("01-today", "20-today-top", {
        "en": "Your private bladder diary",
        "pt": "O seu diário miccional privado",
        "es": "Tu diario miccional privado",
    }),
    ("02-log", "42-add-urination-filled", {
        "en": "Log bathroom visits, drinks and leaks",
        "pt": "Registe idas à casa de banho, bebidas e perdas",
        "es": "Apunta idas al baño, bebidas y pérdidas",
    }),
    # iOS records the weekly chart and summary cards in every language;
    # Android's localized runs record the lower part of Today
    ("03-charts", {"ios": "21-today-mid", "android": "22-today-lower"}, {
        "en": "Daily totals and simple charts",
        "pt": "Totais diários e gráficos simples",
        "es": "Totales diarios y gráficos sencillos",
    }),
    ("04-history", "31-history-day", {
        "en": "Every day, in one place",
        "pt": "Cada dia, num só lugar",
        "es": "Cada día, en un solo lugar",
    }),
    ("05-export", "54-export", {
        "en": "Export a report for your health professional",
        "pt": "Exporte um relatório para o seu profissional de saúde",
        "es": "Exporta un informe para tu profesional de la salud",
    }),
    # The first welcome page says the diary stays on the phone
    ("06-private", "01-welcome", {
        "en": "Kept on your phone. No account.",
        "pt": "Guardado no seu telemóvel. Sem conta.",
        "es": "Guardado en tu móvil. Sin cuenta.",
    }),
]

# Brand colours (lib/theme/colors.ts)
TEAL_DARK = (0, 77, 84)
TEAL = (0, 109, 119)
WHITE = (255, 255, 255)
BEZEL = (17, 24, 39)


def latest_capture(folder: Path, name: str) -> Path | None:
    """The newest run's screenshot with this name, in any chapter."""
    matches = sorted(folder.glob(f"*/*/takeScreenshot/{name}.png"))
    return matches[-1] if matches else None


def wrap(draw: ImageDraw.ImageDraw, text: str, font, width: int) -> list[str]:
    lines: list[str] = []
    for word in text.split():
        trial = f"{lines[-1]} {word}" if lines else word
        if lines and draw.textlength(trial, font=font) <= width:
            lines[-1] = trial
        else:
            lines.append(word)
    return lines


def compose(capture: Path, caption: str, size: tuple[int, int]) -> Image.Image:
    width, height = size
    canvas = Image.new("RGB", size, TEAL)
    # Vertical gradient, darker at the top behind the caption
    gradient = Image.new("RGB", (1, height))
    for y in range(height):
        t = y / (height - 1)
        gradient.putpixel(
            (0, y), tuple(round(a + (b - a) * t) for a, b in zip(TEAL_DARK, TEAL))
        )
    canvas.paste(gradient.resize(size))
    draw = ImageDraw.Draw(canvas)

    # Caption: Fraunces, up to three lines, centred
    margin = round(width * 0.08)
    font_size = round(width * 0.085)
    font = ImageFont.truetype(str(FONTS / "fraunces-400.ttf"), font_size)
    lines = wrap(draw, caption, font, width - 2 * margin)
    while len(lines) > 3:
        font_size = round(font_size * 0.92)
        font = ImageFont.truetype(str(FONTS / "fraunces-400.ttf"), font_size)
        lines = wrap(draw, caption, font, width - 2 * margin)
    line_height = round(font_size * 1.18)
    top = round(height * 0.055)
    for i, line in enumerate(lines):
        draw.text(
            (width / 2, top + i * line_height), line, font=font, fill=WHITE, anchor="ma"
        )
    caption_bottom = top + len(lines) * line_height

    # Phone: the capture in a dark rounded frame, bleeding off the bottom
    screen = Image.open(capture).convert("RGB")
    phone_top = caption_bottom + round(height * 0.035)
    phone_width = round(width * 0.80)
    bezel = round(phone_width * 0.028)
    screen_width = phone_width - 2 * bezel
    screen_height = round(screen.height * screen_width / screen.width)
    screen = screen.resize((screen_width, screen_height), Image.LANCZOS)
    phone_height = screen_height + 2 * bezel
    phone_left = (width - phone_width) // 2
    radius = round(phone_width * 0.12)

    shadow = Image.new("L", size, 0)
    ImageDraw.Draw(shadow).rounded_rectangle(
        (phone_left, phone_top + 24, phone_left + phone_width, phone_top + phone_height + 24),
        radius,
        fill=140,
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(40))
    canvas.paste((0, 30, 34), mask=shadow)

    draw.rounded_rectangle(
        (phone_left, phone_top, phone_left + phone_width, phone_top + phone_height),
        radius,
        fill=BEZEL,
    )
    mask = Image.new("L", screen.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, screen_width, screen_height), radius - bezel, fill=255
    )
    canvas.paste(screen, (phone_left + bezel, phone_top + bezel), mask)
    return canvas


# Google Play feature graphic: name, tagline (the App Store subtitle) and the
# Today screen, 1024 x 500, no transparency
TAGLINES = {
    "en": "Your private bladder diary",
    "pt": "Diário miccional privado",
    "es": "Tu diario miccional privado",
}
ICON = ROOT / "assets" / "images" / "icon.png"


def feature_graphic(capture: Path, lang: str) -> Image.Image:
    width, height = 1024, 500
    canvas = Image.new("RGB", (width, height), TEAL)
    gradient = Image.new("RGB", (width, 1))
    for x in range(width):
        t = x / (width - 1)
        gradient.putpixel(
            (x, 0), tuple(round(a + (b - a) * t) for a, b in zip(TEAL_DARK, TEAL))
        )
    canvas.paste(gradient.resize((width, height)))
    draw = ImageDraw.Draw(canvas)

    # Icon and words on the left
    icon_size = 120
    icon = Image.open(ICON).convert("RGB").resize((icon_size, icon_size), Image.LANCZOS)
    mask = Image.new("L", icon.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, icon_size, icon_size), 28, fill=255)
    left = 64
    canvas.paste(icon, (left, 92), mask)
    name_font = ImageFont.truetype(str(FONTS / "fraunces-400.ttf"), 78)
    tag_font = ImageFont.truetype(str(FONTS / "dm-sans-500.ttf"), 34)
    draw.text((left, 236), "Eleva Diary", font=name_font, fill=WHITE)
    for i, line in enumerate(wrap(draw, TAGLINES[lang], tag_font, 470)):
        draw.text((left, 340 + i * 44), line, font=tag_font, fill=(205, 232, 234))

    # The Today screen in a phone, cut by the bottom edge
    screen = Image.open(capture).convert("RGB")
    phone_width = 300
    bezel = 9
    screen_width = phone_width - 2 * bezel
    screen = screen.resize(
        (screen_width, round(screen.height * screen_width / screen.width)), Image.LANCZOS
    )
    phone_left, phone_top = 650, 60
    draw.rounded_rectangle(
        (phone_left, phone_top, phone_left + phone_width, phone_top + screen.height + 2 * bezel),
        40,
        fill=BEZEL,
    )
    mask = Image.new("L", screen.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, screen.width, screen.height), 32, fill=255
    )
    canvas.paste(screen, (phone_left + bezel, phone_top + bezel), mask)
    return canvas


def main() -> int:
    missing = []
    for store, spec in STORES.items():
        for lang in ("en", "pt", "es"):
            folder = CAPTURES / (spec["platform"] + ("" if lang == "en" else f"-{lang}"))
            out_dir = OUT / store / lang
            out_dir.mkdir(parents=True, exist_ok=True)
            for scene, capture_name, captions in SCENES:
                if isinstance(capture_name, dict):
                    capture_name = capture_name[spec["platform"]]
                capture = latest_capture(folder, capture_name)
                if capture is None:
                    missing.append(f"{folder.name}/{capture_name}")
                    continue
                image = compose(capture, captions[lang], spec["size"])
                assert image.size == spec["size"]
                image.save(out_dir / f"{scene}.png", optimize=True)
    for lang in ("en", "pt", "es"):
        folder = CAPTURES / ("android" + ("" if lang == "en" else f"-{lang}"))
        capture = latest_capture(folder, "20-today-top")
        if capture is None:
            missing.append(f"{folder.name}/20-today-top")
            continue
        image = feature_graphic(capture, lang)
        assert image.size == (1024, 500)
        image.save(OUT / "google" / lang / "feature-graphic.png", optimize=True)
    for item in missing:
        print(f"missing capture: {item}", file=sys.stderr)
    print(f"Wrote {OUT}")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
