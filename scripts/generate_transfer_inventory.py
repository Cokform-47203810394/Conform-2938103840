from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
import csv
import subprocess

ROOT = Path(__file__).resolve().parents[1]
TRANSFER = ROOT / "docs" / "transfer"
INVENTORY = TRANSFER / "FILE_INVENTORY.csv"
MANIFEST = TRANSFER / "TRANSFER_MANIFEST.md"
GIT_HISTORY = TRANSFER / "GIT_HISTORY.txt"

INCLUDE_ROOTS = ["src", "public", "supabase", "docs", "scripts", ".github"]
INCLUDE_FILES = [
    "README.md", "LICENSE", "package.json", "package-lock.json", "index.html",
    "vite.config.js", "tailwind.config.js", "postcss.config.js", ".env.example",
    ".gitignore", "feedback-audit.md", "forms-comparison.md", "forms-comparison-report.md",
    "oauth-diagnosis.md", ".security-audit.md", "form-builder.jsx",
]
EXCLUDED_DIRS = {".git", "node_modules", "dist", ".cache", "coverage", "playwright-report"}
EXCLUDED_NAMES = {".env", ".env.local", ".env.production", ".env.development"}
SENSITIVE_MARKERS = ("PRIVATE KEY", "SUPABASE_SERVICE_ROLE_KEY=", "CF_API_TOKEN=", "GITHUB_TOKEN=", "OPENAI_API_KEY=")


def is_safe(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    if relative.parts[:2] == ("docs", "transfer"):
        return False
    if any(part in EXCLUDED_DIRS for part in relative.parts):
        return False
    if path.name in EXCLUDED_NAMES or path.name.endswith(".pem") or path.name.endswith(".p12"):
        return False
    return path.is_file()


def category(relative: str) -> str:
    if relative.startswith("src/"):
        return "application-source"
    if relative.startswith("supabase/"):
        return "database-and-edge-function"
    if relative.startswith("public/"):
        return "public-asset"
    if relative.startswith("docs/"):
        return "documentation"
    if relative.startswith("scripts/"):
        return "maintenance-script"
    if relative.startswith(".github/"):
        return "ci-cd"
    return "project-config"


def has_marker(path: Path) -> bool:
    # The inventory generator contains literal marker names as code. It is safe to
    # transfer that implementation; other files with an actual marker are excluded.
    if path == Path(__file__).resolve():
        return False
    try:
        if path.stat().st_size > 2_000_000:
            return False
        text = path.read_text(encoding="utf-8", errors="ignore")
        return any(marker in text for marker in SENSITIVE_MARKERS)
    except OSError:
        return True


def git_output(args: list[str]) -> str:
    try:
        return subprocess.check_output(args, cwd=ROOT, text=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as error:
        return error.output


def run() -> None:
    TRANSFER.mkdir(parents=True, exist_ok=True)
    paths: set[Path] = set()
    for root_name in INCLUDE_ROOTS:
        folder = ROOT / root_name
        if folder.exists():
            paths.update(path for path in folder.rglob("*") if is_safe(path))
    for filename in INCLUDE_FILES:
        path = ROOT / filename
        if path.exists() and is_safe(path):
            paths.add(path)

    rows: list[dict[str, str]] = []
    skipped: list[str] = []
    for path in sorted(paths):
        relative = path.relative_to(ROOT).as_posix()
        if has_marker(path):
            skipped.append(relative)
            continue
        digest = sha256(path.read_bytes()).hexdigest()
        rows.append({
            "path": relative,
            "category": category(relative),
            "bytes": str(path.stat().st_size),
            "sha256": digest,
        })

    with INVENTORY.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["path", "category", "bytes", "sha256"], lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    history = "\n".join([
        "# Git History Snapshot",
        "",
        "## Current local history",
        "```text",
        git_output(["git", "log", "--oneline", "-30"]).rstrip(),
        "```",
        "",
        "## Current status",
        "```text",
        git_output(["git", "status", "--short", "--", ".", ":(exclude)docs/transfer"]).rstrip() or "clean",
        "```",
        "",
        "## Current remotes",
        "```text",
        git_output(["git", "remote", "-v"]).rstrip() or "No usable remote URL configured.",
        "```",
        "",
        "This snapshot intentionally does not include tokens, credentials, or remote URLs with embedded credentials.",
        "",
    ])
    GIT_HISTORY.write_text(history, encoding="utf-8")

    manifest = "\n".join([
        "# Cokform Transfer Manifest",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        f"- Included files: **{len(rows)}**",
        f"- Excluded by secret marker: **{len(skipped)}**",
        "- Excluded directories: `.git`, `node_modules`, `dist`, caches, coverage, browser reports.",
        "- Excluded files: real `.env` files, `.pem`, `.p12`, private keys, credentials and detected secret markers.",
        "- The inventory is a SHA-256 manifest. Verify it after unpacking before continuing development.",
        "",
        "## Integrity check",
        "",
        "```bash",
        "python3 scripts/verify_transfer_inventory.py",
        "```",
        "",
        "## Deliberately not transferred",
        "",
        "Actual browser sessions, OAuth tokens, Supabase/Cloudflare/GitHub secrets, personal keys, recovery files, response ciphertext/plaintext and customer identifiers are not in this package. Reconnect services through the platform dashboards after transfer.",
        "",
    ])
    MANIFEST.write_text(manifest, encoding="utf-8")
    print(f"Inventory rows: {len(rows)}")
    print(f"Skipped secret-marker files: {len(skipped)}")


if __name__ == "__main__":
    run()
