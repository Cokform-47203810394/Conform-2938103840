from __future__ import annotations

import csv
from datetime import datetime
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
TRANSFER = ROOT / "docs" / "transfer"
INVENTORY = TRANSFER / "FILE_INVENTORY.csv"
OUTPUT_DIR = ROOT.parent / "Cokform-handover-packages"
PACKAGE_PREFIX = "Cokform-Conform-2938103840"
TRANSFER_FILES = {
    "docs/transfer/FILE_INVENTORY.csv",
    "docs/transfer/GIT_HISTORY.txt",
    "docs/transfer/TRANSFER_MANIFEST.md",
    "docs/transfer/RESTORE_AND_CONTINUE.md",
    "docs/transfer/PACKAGE_README.md",
    "docs/transfer/CONVERSATION_AND_DECISION_RECORD.md",
    "docs/transfer/SESSION_CONTINUITY_2026-08-22.md",
    "docs/transfer/DATA_LOCATION_MAP.md",
    "docs/transfer/DATA_LOCATION_MAP_CURRENT.md",
}


def inventory_paths() -> list[str]:
    if not INVENTORY.exists():
        raise FileNotFoundError("먼저 python3 scripts/generate_transfer_inventory.py 를 실행하세요.")
    with INVENTORY.open(encoding="utf-8", newline="") as file:
        return [row["path"] for row in csv.DictReader(file)]


def run() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d")
    output = OUTPUT_DIR / f"Cokform_handover_{stamp}.zip"
    paths = sorted(set(inventory_paths()) | {path for path in TRANSFER_FILES if (ROOT / path).is_file()})

    with ZipFile(output, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for relative in paths:
            source = ROOT / relative
            if not source.is_file():
                raise FileNotFoundError(f"패키지에 필요한 파일이 없습니다: {relative}")
            archive.write(source, f"{PACKAGE_PREFIX}/{relative}")

    print(f"Archive: {output}")
    print(f"Included files: {len(paths)}")


if __name__ == "__main__":
    run()
