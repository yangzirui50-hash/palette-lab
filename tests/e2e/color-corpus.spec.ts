import { expect, test } from '@playwright/test'
import path from 'node:path'
import Color from 'colorjs.io'
import type { PaletteSwatch, RGBPixel } from '../../src/lib/color/extract'

const fixture = (name: string) => path.resolve(`tests/fixtures/${name}`)
const corpus = [
  'person-test.png',
  'product-reflection-test.png',
  'landscape-test.png',
  'ui-test.png',
  'poster-test.png',
  'monochrome-test.png',
  'transparent-test.png',
  'tiny-test.png',
]

function toSwatch(hex: string): PaletteSwatch {
  const color = new Color(hex)
  return {
    hex,
    rgb: color.to('srgb').coords.map((channel) => Math.round((channel ?? 0) * 255)) as unknown as RGBPixel,
    oklch: color.to('oklch').coords.map((channel) => channel ?? 0) as unknown as RGBPixel,
    share: 0,
  }
}

test('processes diverse image types sequentially without stale state or invalid output', async ({ page }) => {
  await page.goto('/')
  for (const name of corpus) {
    await page.locator('.workspace input[type=file]').setInputFiles(fixture(name))
    await expect(page.locator('.spatial-preview img')).toBeVisible()
    await expect(page.locator('.spatial-swatches button')).not.toHaveCount(0)
    await expect(page.locator('.spatial-palette-heading')).toContainText('全局色板')
    await expect(page.locator('.spatial-roi')).toHaveCount(0)
    await expect(page.locator('.error-message')).toHaveCount(0)
    const shares = await page.locator('.spatial-swatches button small').allTextContents()
    const total = shares.reduce((sum, value) => sum + Number.parseFloat(value), 0)
    expect(total).toBeGreaterThan(99)
    expect(total).toBeLessThan(101)
    await expect(page.locator('.spatial-unassigned')).toContainText(/\d+\.\d%/)
    await expect(page.locator('.spatial-facts-core')).toContainText('视觉显著度')
    await expect(page.locator('.spatial-facts-core')).not.toContainText('NaN')
    await page.getByRole('button', { name: '散点分布', exact: true }).click()
    await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /色彩密度热图/)
    await page.getByRole('button', { name: '连续区域', exact: true }).click()
    await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /颜色区域高亮/)
  }
})

test('preserves both saturated families in periodic red-blue textures', async ({ page }) => {
  await page.goto('/')
  await page.locator('.workspace input[type=file]').setInputFiles(fixture('periodic-test.png'))
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  const hexes = await page.locator('.spatial-swatches button span').allTextContents()
  const hasRed = hexes.some((hex) => {
    const value = Number.parseInt(hex.slice(1), 16)
    return (value >> 16) > ((value >> 8) & 255) * 2 && (value >> 16) > (value & 255) * 1.5
  })
  const blueIndex = hexes.findIndex((hex) => {
    const value = Number.parseInt(hex.slice(1), 16)
    return (value & 255) > (value >> 16) * 2 && (value & 255) > ((value >> 8) & 255) * 1.5
  })
  expect(hasRed).toBe(true)
  expect(blueIndex).toBeGreaterThanOrEqual(0)
  const redPixelsInBlue = await page.evaluate(async ({ palette, blueIndex: selectedIndex }) => {
    const { imageFileToSpatialData } = await import('/src/lib/color/spatialOverlay.ts')
    const { buildSpatialAssignments } = await import('/src/lib/color/spatial.ts')
    const response = await fetch('/tests/fixtures/periodic-test.png')
    const file = new File([await response.blob()], 'periodic-test.png', { type: 'image/png' })
    const data = await imageFileToSpatialData(file)
    const result = buildSpatialAssignments(data.pixels, data.width, data.height, palette, false)
    return data.pixels.reduce((count, rgb, index) => count + (
      rgb && rgb[0] > rgb[1] * 2 && rgb[0] > rgb[2] * 1.5 && result.assignments[index] === selectedIndex ? 1 : 0
    ), 0)
  }, { palette: hexes.map(toSwatch), blueIndex })
  expect(redPixelsInBlue).toBe(0)
})

test('keeps person face and arms complete and creates an independent face ROI palette', async ({ page }) => {
  await page.goto('/')
  await page.locator('.workspace input[type=file]').setInputFiles(fixture('person-test.png'))
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  await expect(page.locator('.spatial-mode button')).toHaveText('全部近似色区域')
  const buttons = page.locator('.spatial-swatches button')
  const rgbValues = await buttons.locator('i').evaluateAll((elements) => elements.map((element) => getComputedStyle(element).backgroundColor))
  const lightIndex = rgbValues.reduce((best, value, index) => {
    const channels = value.match(/\d+/g)?.map(Number) ?? [0, 0, 0]
    return channels[0] + channels[1] + channels[2] > rgbValues[best].match(/\d+/g)!.map(Number).reduce((a, b) => a + b, 0) ? index : best
  }, 0)
  await buttons.nth(lightIndex).click()
  await page.locator('.spatial-panel').screenshot({ path: 'test-results/person-corpus-all-regions.png' })
  await page.locator('.spatial-roi-actions button').first().click()
  await page.locator('.spatial-image-stage').scrollIntoViewIfNeeded()
  const stage = await page.locator('.spatial-image-stage').boundingBox()
  if (!stage) throw new Error('Spatial image stage not found')
  await page.mouse.move(stage.x + stage.width * 0.22, stage.y + stage.height * 0.27)
  await page.mouse.down()
  await page.mouse.move(stage.x + stage.width * 0.78, stage.y + stage.height * 0.61, { steps: 5 })
  await page.mouse.up()
  await expect(page.locator('.spatial-palette-heading')).toContainText('局部色板')
  await expect(page.locator('.spatial-swatches button').first()).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.swatch-row')).toHaveCount(6)
  await page.locator('.spatial-panel').screenshot({ path: 'test-results/person-corpus-local.png' })
})
