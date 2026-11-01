from PIL import Image

image = Image.open('tests/fixtures/night-city-test.png')
for edge in (320, 768):
    scale = edge / max(image.size)
    size = tuple(round(value * scale) for value in image.size)
    image.resize(size, Image.Resampling.LANCZOS).save(f'tests/fixtures/night-city-{edge}.png')
