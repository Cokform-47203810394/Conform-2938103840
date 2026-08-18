from pathlib import Path
import shutil
import subprocess

project = Path(__file__).resolve().parents[1]
source = project / "public" / "og-image.svg"
target = project / "public" / "og-image.png"
chromium = shutil.which("chromium")

if not chromium:
    raise RuntimeError("Chromium is required to render the Korean OG image.")

subprocess.run(
    [
        chromium,
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1200,630",
        f"--screenshot={target}",
        source.as_uri(),
    ],
    check=True,
)
print(target)
