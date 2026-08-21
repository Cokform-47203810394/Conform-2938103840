from __future__ import annotations

from hashlib import sha256
from pathlib import Path
import csv
import sys

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "docs" / "transfer" / "FILE_INVENTORY.csv"


def run() -> int:
    if not INVENTORY.exists():
        print(f"Inventory missing: {INVENTORY}")
        return 2

    missing: list[str] = []
    changed: list[str] = []
    checked = 0
    with INVENTORY.open(encoding="utf-8", newline="") as file:
        for row in csv.DictReader(file):
            path = ROOT / row["path"]
            if not path.exists():
                missing.append(row["path"])
                continue
            digest = sha256(path.read_bytes()).hexdigest()
            if digest != row["sha256"]:
                changed.append(row["path"])
            checked += 1

    print(f"Checked: {checked}")
    print(f"Missing: {len(missing)}")
    print(f"Changed: {len(changed)}")
    if missing:
        print("Missing files:")
        print("\n".join(missing[:20]))
    if changed:
        print("Changed files:")
        print("\n".join(changed[:20]))
    return 0 if not missing and not changed else 1


if __name__ == "__main__":
    sys.exit(run())
