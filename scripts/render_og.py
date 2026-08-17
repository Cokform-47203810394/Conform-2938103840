from pathlib import Path
import cairosvg

project = Path(__file__).resolve().parents[1]
source = project / "public" / "og-image.svg"
target = project / "public" / "og-image.png"
cairosvg.svg2png(url=str(source), write_to=str(target), output_width=1200, output_height=630)
print(target)
