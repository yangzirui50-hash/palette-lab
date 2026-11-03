import { expect, test } from '@playwright/test'
import path from 'node:path'
import Color from 'colorjs.io'
import type { PaletteSwatch, RGBPixel } from '../../src/lib/color/extract'

const nightFixture = path.resolve('tests/fixtures/night-city-test.png')
const simpleFixture = path.resolve('tests/fixtures/palette-test.png')

function toSwatch(hex: string): PaletteSwatch {
  const color = new Color(hex)
  return {
    hex,
    rgb: color.to('srgb').coords.map((channel) => Math.round((channel ?? 0) * 255)) as unknown as RGBPixel,
    oklch: color.to('oklch').coords.map((channel) => channel ?? 0) as unknown as RGBPixel,
    share: 0,
  }
}

test('keeps red families out of deep-blue regions and resets ROI on source change', async ({ page }) => {
  await page.goto('/')
  await page.locator('.workspace input[type=file]').setInputFiles(nightFixture)
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  const hexes = await page.locator('.spatial-swatches button span').allTextContents()
  const hasRed = hexes.some((hex) => {
    const value = Number.parseInt(hex.slice(1), 16)
    const r = value >> 16
    const g = (value >> 8) & 255
    const b = value & 255
    return r > g * 1.3 && r > b * 1.2
  })
  expect(hasRed).toBe(true)
  const blueIndex = hexes.findIndex((hex) => {
    const value = Number.parseInt(hex.slice(1), 16)
    const r = value >> 16
    const g = (value >> 8) & 255
    const b = value & 255
    return b > r * 1.1 && b > g * 1.05
  })
  expect(blueIndex).toBeGreaterThanOrEqual(0)

  const redPixelsInBlue = await page.evaluate(async ({ palette, blueIndex: selectedIndex }) => {
    const { imageFileToSpatialData } = await import('/src/lib/color/spatialOverlay.ts')
    const { buildSpatialAssignments } = await import('/src/lib/color/spatial.ts')
    const response = await fetch('/tests/fixtures/night-city-test.png')
    if (!response.ok) throw new Error('Missing night fixture')
    const file = new File([await response.blob()], 'night-city-test.png', { type: 'image/png' })
    const data = await imageFileToSpatialData(file)
    const result = buildSpatialAssignments(data.pixels, data.width, data.height, palette, true)
    return data.pixels.reduce((count, rgb, index) => count + (
      rgb && rgb[0] > 50 && rgb[0] > rgb[1] * 1.4 && rgb[0] > rgb[2] * 1.2 && result.assignments[index] === selectedIndex ? 1 : 0
    ), 0)
  }, { palette: hexes.map(toSwatch), blueIndex })
  expect(redPixelsInBlue).toBe(0)

  const previousOverlay = await page.locator('.spatial-preview img').getAttribute('src')
  await page.locator('.spatial-swatches button').nth(blueIndex).click()
  await expect.poll(async () => {
    const src = await page.locator('.spatial-preview img').getAttribute('src')
    return Boolean(src && src !== previousOverlay)
  }).toBe(true)
  await expect(page.locator('.spatial-unassigned')).toContainText('未可靠归属')
  await page.locator('.spatial-panel').screenshot({ path: 'test-results/night-root-fix.png' })

  await page.locator('.spatial-roi-actions button').first().click()
  await page.locator('.spatial-image-stage').scrollIntoViewIfNeeded()
  const stage = await page.locator('.spatial-image-stage').boundingBox()
  if (!stage) throw new Error('Spatial image stage not found')
  await page.mouse.move(stage.x + stage.width * 0.3, stage.y + stage.height * 0.3)
  await page.mouse.down()
  await page.mouse.move(stage.x + stage.width * 0.6, stage.y + stage.height * 0.6, { steps: 4 })
  await page.mouse.up()
  await expect(page.locator('.spatial-roi')).toBeVisible()
  await page.locator('.workspace input[type=file]').setInputFiles(simpleFixture)
  await expect(page.locator('.spatial-roi')).toHaveCount(0)
  await expect(page.locator('.spatial-palette-heading')).toContainText('全局色板')
})
