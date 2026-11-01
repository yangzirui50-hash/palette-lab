from PIL import Image, ImageDraw
import numpy as np
import json
import random

random.seed(50)
out = 'tests/fixtures/benchmark'
manifest = []
sizes = [(320, 240), (480, 320), (240, 480), (640, 360), (180, 120), (900, 300)]
counts = {'gradient': 7, 'noise': 6, 'geometric': 6, 'periodic': 5, 'low-contrast': 5, 'transparent': 5, 'aspect': 5}
categories = [name for name, count in counts.items() for _ in range(count)]

def rgb(hue):
    import colorsys
    return tuple(round(v * 255) for v in colorsys.hsv_to_rgb((hue % 360) / 360, 0.72, 0.82))

for index, category in enumerate(categories, start=1):
    width, height = sizes[(index - 1) % len(sizes)]
    hue = index * 47
    c1, c2, c3 = rgb(hue), rgb(hue + 115), rgb(hue + 215)
    if category == 'gradient':
        y, x = np.mgrid[0:height, 0:width]
        t = (x / width * 0.65 + y / height * 0.35)[..., None]
        a, b = np.array(c1), np.array(c2)
        data = (a * (1 - t) + b * t).astype(np.uint8)
        image = Image.fromarray(data)
        draw = ImageDraw.Draw(image)
        draw.ellipse((width * 0.55, height * 0.15, width * 0.88, height * 0.72), fill=c3)
    elif category == 'noise':
        y, x = np.mgrid[0:height, 0:width]
        base = np.zeros((height, width, 3)) + np.array(c1) * 0.35
        base += (x / width)[..., None] * (np.array(c2) - np.array(c1)) * 0.65
        noise = np.random.default_rng(index).normal(0, 24 + index * 2, base.shape)
        image = Image.fromarray(np.clip(base + noise, 0, 255).astype(np.uint8))
    elif category == 'geometric':
        image = Image.new('RGB', (width, height), c1)
        draw = ImageDraw.Draw(image)
        for shape in range(9):
            left, top = random.randrange(width), random.randrange(height)
            rw, rh = random.randrange(12, max(14, width // 3)), random.randrange(12, max(14, height // 3))
            color = [c2, c3, rgb(hue + shape * 23)][shape % 3]
            if shape % 2:
                draw.rectangle((left, top, min(width, left + rw), min(height, top + rh)), fill=color)
            else:
                draw.ellipse((left, top, min(width, left + rw), min(height, top + rh)), fill=color)
    elif category == 'periodic':
        image = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(image)
        period = [2, 3, 5, 8, 12][index % 5]
        for x in range(0, width, period):
            draw.rectangle((x, 0, min(width, x + period - 1), height), fill=c1 if (x // period) % 2 else c2)
        for y in range(0, height, period * 2):
            draw.rectangle((0, y, width, min(height, y + period - 1)), fill=(*c3,))
    elif category == 'low-contrast':
        base = 65 if index % 2 else 145
        image = Image.new('RGB', (width, height), (base, base + 3, base + 6))
        draw = ImageDraw.Draw(image)
        draw.rectangle((0, 0, width // 2, height), fill=(base + 8, base + 5, base + 2))
        draw.ellipse((width * 0.58, height * 0.2, width * 0.84, height * 0.7), fill=(base + 13, base + 11, base + 9))
    elif category == 'transparent':
        image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        draw.rectangle((8, 8, width * 0.55, height * 0.58), fill=(*c1, 255))
        draw.ellipse((width * 0.36, height * 0.18, width * 0.88, height * 0.82), fill=(*c2, 96 + index * 20))
        draw.rectangle((width * 0.18, height * 0.62, width * 0.72, height * 0.9), fill=(*c3, 190))
    else:
        image = Image.new('RGB', (width, height), c1)
        draw = ImageDraw.Draw(image)
        for field in range(6):
            left = width * field / 6
            draw.rectangle((left, 0, width * (field + 1) / 6, height), fill=rgb(hue + field * 45))
        draw.ellipse((width * 0.42, height * 0.32, width * 0.58, height * 0.68), fill=c3)

    name = f'benchmark-{index:02d}-{category}.png'
    image.save(f'{out}/{name}', optimize=True)
    manifest.append({'file': name, 'category': category, 'width': width, 'height': height})

with open(f'{out}/manifest.json', 'w') as handle:
    json.dump(manifest, handle, ensure_ascii=False, indent=2)

contact = Image.new('RGB', (7 * 150, 6 * 120), '#eeeeee')
draw = ImageDraw.Draw(contact)
for index, item in enumerate(manifest):
    thumb = Image.open(f'{out}/{item["file"]}').convert('RGB')
    thumb.thumbnail((142, 100))
    x, y = (index % 7) * 150, (index // 7) * 120
    contact.paste(thumb, (x + 4, y + 4))
    draw.text((x + 4, y + 105), f'{index + 1:02d} {item["category"]}', fill='#222222')
contact.save('test-results/benchmark-50-contact-sheet.png')
