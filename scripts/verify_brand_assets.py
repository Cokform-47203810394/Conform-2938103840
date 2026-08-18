"""Verify generated Cokform brand assets before release."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "public" / "brand"
EXPECTED = {
    "cokform-logo": {"png": (1024, 2048, 4096), "jpg": (1024, 2048, 4096)},
    "cokform-mark": {"png": (512, 1024, 2048), "jpg": (512, 1024, 2048)},
}


def check_raster(path: Path, expected_width: int) -> None:
    with Image.open(path) as image:
        if image.width != expected_width:
            raise ValueError(f"{path.name}: expected width {expected_width}, got {image.width}")
        dpi = image.info.get("dpi")
        if not dpi or any(abs(value - 300) > 1 for value in dpi):
            raise ValueError(f"{path.name}: expected 300 DPI metadata, got {dpi}")
        if path.suffix == ".png" and image.mode != "RGBA":
            raise ValueError(f"{path.name}: expected transparent RGBA PNG, got {image.mode}")


def main() -> None:
    for stem, formats in EXPECTED.items():
        for extension, widths in formats.items():
            for width in widths:
                check_raster(BRAND_DIR / f"{stem}-{width}.{extension}", width)
        for extension in ("svg", "pdf"):
            path = BRAND_DIR / f"{stem}.{extension}"
            if not path.is_file() or path.stat().st_size == 0:
                raise ValueError(f"Missing {path.name}")
    print("PASS: 12 raster files (dimensions + 300 DPI), 4 vector source/PDF files present")


if __name__ == "__main__":
    main()
