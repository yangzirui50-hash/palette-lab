from PIL import Image, ImageDraw
import numpy as np
import random

random.seed(7)

# Reflective product on a dark studio surface.
w, h = 420, 280
y, x = np.mgrid[0:h, 0:w]
base = np.zeros((h, w, 3), dtype=np.uint8)
base[:] = (18, 22, 29)
sphere = (x - 205) ** 2 + (y - 130) ** 2 < 88 ** 2
light = np.clip(1 - np.sqrt((x - 165) ** 2 + (y - 82) ** 2) / 175, 0, 1)
for channel, value in enumerate((45, 145, 205)):
    base[:, :, channel] = np.where(sphere, np.clip(value + light * 115, 0, 255), base[:, :, channel])
base[(y > 220) & (x > 80) & (x < 340)] = (35, 39, 46)
Image.fromarray(base).save('tests/fixtures/product-reflection-test.png')

# Landscape with adjacent green and blue families.
image = Image.new('RGB', (420, 280))
pixels = image.load()
for row in range(160):
    for column in range(420):
        pixels[column, row] = (65 + row // 3, 135 + row // 4, 205 + row // 5)
draw = ImageDraw.Draw(image)
draw.ellipse((315, 28, 355, 68), fill=(245, 215, 105))
draw.polygon([(0, 175), (95, 80), (190, 175)], fill=(45, 85, 90))
draw.polygon([(105, 175), (245, 62), (390, 175)], fill=(55, 105, 110))
draw.rectangle((0, 160, 420, 280), fill=(45, 105, 65))
for _ in range(90):
    px = random.randrange(420)
    py = random.randrange(175, 280)
    draw.ellipse((px, py, px + 3, py + 5), fill=(75, 135, 80))
image.save('tests/fixtures/landscape-test.png')

# Flat UI screenshot.
image = Image.new('RGB', (420, 280), '#f3f5f8')
draw = ImageDraw.Draw(image)
draw.rectangle((0, 0, 420, 48), fill='#162538')
draw.rectangle((20, 70, 115, 255), fill='#dce4ee')
for index, color in enumerate(['#2878d0', '#32a177', '#d95d62']):
    top = 70 + index * 62
    draw.rounded_rectangle((135, top, 395, top + 46), radius=8, fill='#ffffff', outline='#c8d2df')
    draw.rectangle((148, top + 12, 160, top + 24), fill=color)
    draw.text((172, top + 13), f'Module {index + 1}', fill='#263445')
image.save('tests/fixtures/ui-test.png')

# Editorial poster with text and sharp color boundaries.
image = Image.new('RGB', (360, 480), '#eee7d8')
draw = ImageDraw.Draw(image)
draw.rectangle((24, 24, 336, 456), outline='#20201e', width=3)
draw.ellipse((175, 55, 310, 190), fill='#d64a35')
draw.rectangle((42, 230, 318, 245), fill='#20201e')
draw.text((42, 70), 'COLOR', fill='#20201e')
draw.text((42, 100), 'SYSTEM', fill='#20201e')
draw.text((42, 270), 'FORM / FIELD / EVIDENCE', fill='#20201e')
draw.text((42, 405), 'PALETTE LAB  2026', fill='#20201e')
image.save('tests/fixtures/poster-test.png')

# Monochrome and near-monochrome behavior.
image = Image.new('RGB', (240, 240))
draw = ImageDraw.Draw(image)
for index in range(6):
    value = 15 + index * 43
    draw.rectangle((index * 40, 0, index * 40 + 40, 240), fill=(value, value, value + 2))
image.save('tests/fixtures/monochrome-test.png')

# Transparency and partially transparent evidence.
image = Image.new('RGBA', (240, 240), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)
draw.rectangle((20, 20, 105, 105), fill=(225, 50, 80, 255))
draw.ellipse((115, 30, 220, 135), fill=(35, 180, 220, 105))
draw.rectangle((65, 140, 180, 220), fill=(240, 205, 55, 255))
image.save('tests/fixtures/transparent-test.png')

# Periodic saturated stripes expose regular-stride sampling aliases.
image = Image.new('RGB', (320, 180))
draw = ImageDraw.Draw(image)
for x in range(0, 320, 2):
    color = (215, 30, 55) if (x // 2) % 2 == 0 else (25, 75, 215)
    draw.rectangle((x, 0, x + 1, 180), fill=color)
image.save('tests/fixtures/periodic-test.png')

# Tiny input with four exact fields.
image = Image.new('RGB', (16, 16))
draw = ImageDraw.Draw(image)
draw.rectangle((0, 0, 7, 7), fill='#d03050')
draw.rectangle((8, 0, 15, 7), fill='#2080d0')
draw.rectangle((0, 8, 7, 15), fill='#e0b830')
draw.rectangle((8, 8, 15, 15), fill='#203028')
image.save('tests/fixtures/tiny-test.png')
