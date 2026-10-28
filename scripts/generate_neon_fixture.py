from PIL import Image, ImageDraw, ImageFilter
import random

random.seed(42)
width, height = 480, 320
image = Image.new('RGB', (width, height))
pixels = image.load()
for y in range(height):
    for x in range(width):
        pixels[x, y] = (5 + y // 45, 8 + y // 55, 18 + y // 30)

buildings = ImageDraw.Draw(image)
for index, (left, top, right) in enumerate([(0, 95, 70), (58, 135, 130), (120, 80, 205), (195, 145, 265), (255, 105, 335), (325, 65, 410), (400, 125, 480)]):
    buildings.rectangle((left, top, right, height), fill=(8 + index % 3 * 3, 11, 22 + index % 2 * 5))

glow = Image.new('RGBA', image.size)
glow_draw = ImageDraw.Draw(glow)
colors = [(255, 35, 120), (30, 220, 255), (255, 210, 65), (155, 65, 255)]
lights = []
for _ in range(150):
    if random.random() < 0.7:
        x = random.gauss(350, 65)
        y = random.gauss(105, 55)
    else:
        x = random.uniform(15, 465)
        y = random.uniform(80, 290)
    if 0 <= x < width and 0 <= y < height:
        color = random.choice(colors)
        radius = random.choice([1, 1, 2, 2, 3])
        lights.append((x, y, color, radius))
        glow_draw.ellipse((x - radius * 5, y - radius * 5, x + radius * 5, y + radius * 5), fill=(*color, 90))

glow_draw.rounded_rectangle((292, 52, 424, 106), radius=8, outline=(30, 220, 255, 180), width=10)
glow_draw.rounded_rectangle((52, 178, 158, 222), radius=6, outline=(255, 35, 120, 170), width=9)
image = Image.alpha_composite(image.convert('RGBA'), glow.filter(ImageFilter.GaussianBlur(7)))
core = ImageDraw.Draw(image)
for x, y, color, radius in lights:
    core.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(*color, 255))
core.rounded_rectangle((292, 52, 424, 106), radius=8, outline=(80, 245, 255, 255), width=3)
core.rounded_rectangle((52, 178, 158, 222), radius=6, outline=(255, 85, 150, 255), width=3)
image.convert('RGB').save('tests/fixtures/neon-test.png', optimize=True)
