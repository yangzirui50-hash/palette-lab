import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

test('does not overwrite newer count intent when a completed palette commits between clicks', async ({ page }) => {
  await page.goto('/'); await page.locator('.workspace input[type=file]').setInputFiles(path.resolve('tests/fixtures/neon-test.png'))
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  await page.evaluate(() => {
    const panel = document.querySelector('.palette-panel')!, list = panel.querySelector('.swatch-list')!
    const decrease = () => document.querySelector<HTMLButtonElement>('[aria-label="减少颜色数量"]')!.click()
    const observer = new MutationObserver(() => {
      if (panel.getAttribute('aria-busy') !== 'false') return
      observer.disconnect()
      decrease()
      requestAnimationFrame(decrease)
    })
    observer.observe(list, { childList: true, attributes: true, characterData: true, subtree: true })
    decrease()
  })
  await expect(page.locator('.palette-panel')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.count-control output')).toHaveText('3')
  const event = page.waitForEvent('download'); await page.locator('.export-actions button').nth(1).click()
  const tokens = JSON.parse(fs.readFileSync((await (await event).path())!, 'utf8'))
  expect(tokens.analysis.requestedColorCount).toBe(3)
  expect(tokens.palette.length).toBeLessThanOrEqual(3)
})

test('shows two separate whole-image focus candidates and abstains on a uniform image', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.workspace')).toBeVisible()
  const upload = async (uniform: boolean) => page.evaluate(async uniform => {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128
    const context = canvas.getContext('2d')!
    context.fillStyle = '#5a5a5a'; context.fillRect(0, 0, 128, 128)
    if (!uniform) { context.fillStyle = '#f0f0f0'; context.fillRect(16, 48, 16, 32); context.fillRect(96, 48, 16, 32) }
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(value => resolve(value!)))
    const transfer = new DataTransfer(); transfer.items.add(new File([blob], uniform ? 'uniform.png' : 'two-foci.png', { type: 'image/png' }))
    const input = document.querySelector<HTMLInputElement>('.workspace input[type=file]')!
    input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }))
  }, uniform)
  await upload(false)
  await expect(page.locator('.attention-panel summary')).toContainText('多焦点')
  await page.locator('.attention-panel summary').click()
  await expect(page.locator('.attention-marker')).toHaveCount(2)
  await expect(page.locator('.attention-image img')).toBeVisible()
  const positions = await page.locator('.attention-marker').evaluateAll(markers => markers.map(marker => Number.parseFloat((marker as HTMLElement).style.left)))
  expect(Math.min(...positions)).toBeLessThan(30); expect(Math.max(...positions)).toBeGreaterThan(70)
  await upload(true)
  await expect(page.locator('.attention-panel summary')).toContainText('无明确焦点')
  await expect(page.locator('.attention-marker')).toHaveCount(0)
})

test('keeps an unselected red pixel out of the actual blue overlay after denoising and feathering', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.workspace')).toBeVisible()
  const pixel = await page.evaluate(async () => {
    const { extractPalette } = await import('/src/lib/color/extract.ts')
    const { createSpatialOverlay } = await import('/src/lib/color/spatialOverlay.ts')
    const canvas = document.createElement('canvas')
    canvas.width = 9; canvas.height = 9
    const context = canvas.getContext('2d')!
    context.fillStyle = '#0000ff'; context.fillRect(0, 0, 9, 9)
    context.fillStyle = '#ff0000'; context.fillRect(4, 4, 1, 1)
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(value => resolve(value!)))
    const pixels = Array.from({ length: 81 }, (_, index): [number, number, number] => index === 40 ? [255, 0, 0] : [0, 0, 255])
    const url = await createSpatialOverlay(new File([blob], 'accent.png', { type: 'image/png' }), extractPalette(pixels, 2), '#0000ff', 512, 'all')
    const image = await createImageBitmap(await (await fetch(url)).blob())
    context.drawImage(image, 0, 0)
    return Array.from(context.getImageData(4, 4, 1, 1).data)
  })
  expect(pixel[0]).toBe(pixel[1])
  expect(pixel[1]).toBe(pixel[2])
  expect(pixel[3]).toBe(255)
})

test('applies the latest count even when changed twice during image import', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.workspace')).toBeVisible()
  const bytes = Array.from(fs.readFileSync(path.resolve('tests/fixtures/night-city-test.png')))
  await page.evaluate(bytes => {
    const transfer = new DataTransfer()
    transfer.items.add(new File([new Uint8Array(bytes)], 'count-race.png', { type: 'image/png' }))
    const input = document.querySelector<HTMLInputElement>('.workspace input[type=file]')!
    input.files = transfer.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
    const increase = document.querySelector<HTMLButtonElement>('[aria-label="增加颜色数量"]')!
    increase.click(); increase.click()
  }, bytes)
  await expect(page.locator('.count-control output')).toHaveText('8')
  await expect(page.locator('.palette-panel')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.swatch-row')).toHaveCount(8)
  await expect(page.locator('.spatial-preview img')).toBeVisible()
})

test('crops native pixels before resizing and exposes the local detail without changing the global palette', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.workspace')).toBeVisible()
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 2048
    const context = canvas.getContext('2d')!
    context.fillStyle = '#808080'; context.fillRect(0, 0, 2048, 2048)
    for (let x = 768; x < 832; x += 1) {
      context.fillStyle = x % 2 ? '#ff0000' : '#0000ff'; context.fillRect(x, 768, 1, 64)
    }
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(value => resolve(value!)))
    const file = new File([blob], 'native-detail.png', { type: 'image/png', lastModified: 42 })
    const transfer = new DataTransfer(); transfer.items.add(file)
    const input = document.querySelector<HTMLInputElement>('.workspace input[type=file]')!
    input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }))
    ;(window as unknown as { repeatFile: File }).repeatFile = file
  })
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  const global = await page.locator('.swatch-info strong').allTextContents()
  await page.getByRole('button', { name: '框选分析区域', exact: true }).click()
  const box = await page.locator('.spatial-image-stage').boundingBox()
  if (!box) throw new Error('Missing image stage')
  await page.mouse.move(box.x + box.width * .375, box.y + box.height * .375)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * .40625, box.y + box.height * .40625, { steps: 4 })
  await page.mouse.up()
  await expect(page.locator('.spatial-detail img')).toBeVisible()
  expect(Number(await page.locator('.spatial-detail').getAttribute('data-analysis-width'))).toBeGreaterThanOrEqual(62)
  const local = await page.locator('.spatial-swatches button span').allTextContents()
  expect(local).toContain('#ff0000'); expect(local).toContain('#0000ff')
  expect(await page.locator('.swatch-info strong').allTextContents()).toEqual(global)
  await page.evaluate(() => {
    const transfer = new DataTransfer(); transfer.items.add((window as unknown as { repeatFile: File }).repeatFile)
    const input = document.querySelector<HTMLInputElement>('.workspace input[type=file]')!
    input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page.locator('.spatial-palette-heading')).toContainText('全局色板')
  await expect(page.locator('.spatial-detail')).toHaveCount(0)
})
