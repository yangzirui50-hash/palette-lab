from pathlib import Path
from PIL import Image

output = Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "palette-test.png"
output.parent.mkdir(parents=True, exist_ok=True)
image = Image.new("RGB", (800, 500), (10, 10, 10))
image.paste((223, 255, 79), (400, 0, 650, 500))
image.paste((74, 144, 226), (650, 0, 800, 500))
image.save(output, optimize=True)
print(output)
