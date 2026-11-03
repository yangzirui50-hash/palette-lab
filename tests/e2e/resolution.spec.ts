import { expect, test } from '@playwright/test'
import path from 'node:path'

const variants = ['night-city-320.png', 'night-city-test.png', 'night-city-768.png']

test('preserves major chromatic families and deterministic output across source resolutions', async ({ page }) => {
  await page.goto('/')
  for (const name of variants) {
    const fixture = path.resolve(`tests/fixtures/${name}`)
    const readPalette = async () => {
      await page.locator('.workspace input[type=file]').setInputFiles(fixture)
      await expect(page.locator('.spatial-preview img')).toBeVisible()
      return page.locator('.spatial-swatches button span').allTextContents()
    }
    const hexes = await readPalette()
    expect(hexes.length).toBeGreaterThan(1)
    expect(hexes.some((hex) => {
      const value = Number.parseInt(hex.slice(1), 16)
      return (value >> 16) > ((value >> 8) & 255) * 1.25 && (value >> 16) > (value & 255) * 1.15
    })).toBe(true)
    expect(hexes.some((hex) => {
      const value = Number.parseInt(hex.slice(1), 16)
      return (value & 255) > (value >> 16) * 1.1 && (value & 255) > ((value >> 8) & 255) * 1.05
    })).toBe(true)
    await expect(page.locator('.spatial-facts-core')).not.toContainText('NaN')
    if (name === variants[0]) expect(await readPalette()).toEqual(hexes)
    else await readPalette()
  }
})
