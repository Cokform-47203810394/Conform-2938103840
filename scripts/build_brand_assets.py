"""Build Cokform official logo and mark downloads from canonical SVG sources.

SVG is authoritative. This script uses Chromium for rendering so Korean wordmarks
use the same browser font fallback as the public brand resource page.
"""
from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path
from urllib.parse import urlencode

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "public" / "brand"
RENDER_PAGE = ROOT / "scripts" / "brand-rasterize.html"
CHROMIUM = "chromium"

ASSETS = {
    "cokform-logo": {
        "source": "cokform-logo.svg",
        "widths": (1024, 2048, 4096),
    },
    "cokform-mark": {
        "source": "cokform-mark.svg",
        "widths": (512, 1024, 2048),
    },
}


def image_height(source: Path, output_width: int) -> int:
    view_box = source.read_text(encoding="utf-8").split("viewBox=\"")[1].split("\"")[0].split()
    source_width, source_height = float(view_box[2]), float(view_box[3])
    return round(output_width * source_height / source_width)


def render_url(asset: str, width: int, height: int) -> str:
    query = urlencode({"asset": asset, "width": width, "height": height})
    return f"{RENDER_PAGE.as_uri()}?{query}"


def chromium_base_args(width: int, height: int) -> list[str]:
    return [
        CHROMIUM,
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--allow-file-access-from-files",
        "--hide-scrollbars",
        "--virtual-time-budget=1500",
        f"--window-size={width},{height}",
    ]


def rasterize_svg(asset: str, width: int, height: int, target: Path) -> None:
    command = chromium_base_args(width, height) + [
        "--default-background-color=00000000",
        f"--screenshot={target}",
        render_url(asset, width, height),
    ]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def stamp_png_dpi(target_png: Path) -> None:
    image = Image.open(target_png).convert("RGBA")
    image.save(target_png, "PNG", optimize=True, dpi=(300, 300))


def save_jpg(source_png: Path, target_jpg: Path) -> None:
    image = Image.open(source_png).convert("RGBA")
    white_background = Image.new("RGB", image.size, "#FFFDF8")
    white_background.paste(image, mask=image.getchannel("A"))
    white_background.save(target_jpg, "JPEG", quality=95, subsampling=0, optimize=True, dpi=(300, 300))


def save_vector_pdf(asset: str, width: int, height: int, target: Path) -> None:
    command = chromium_base_args(width, height) + [
        "--no-pdf-header-footer",
        f"--print-to-pdf={target}",
        render_url(asset, width, height),
    ]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main() -> None:
    for stem, config in ASSETS.items():
        source = BRAND_DIR / config["source"]
        max_width = max(config["widths"])
        max_height = image_height(source, max_width)

        for width in config["widths"]:
            height = image_height(source, width)
            target_png = BRAND_DIR / f"{stem}-{width}.png"
            rasterize_svg(config["source"], width, height, target_png)
            stamp_png_dpi(target_png)
            save_jpg(target_png, BRAND_DIR / f"{stem}-{width}.jpg")

        save_vector_pdf(config["source"], max_width, max_height, BRAND_DIR / f"{stem}.pdf")


if __name__ == "__main__":
    main()
