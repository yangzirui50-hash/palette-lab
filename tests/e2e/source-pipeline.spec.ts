import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

async function png(page: Page, kind: 'solid' | 'nearby' | 'texture') {
  const bytes = await page.evaluate(async kind => {
    const canvas = document.createElement('canvas')
    canvas.width = kind === 'texture' ? 1536 : 64; canvas.height = kind === 'texture' ? 128 : 64
    const context = canvas.getContext('2d')!
    context.fillStyle = '#6496c8'; context.fillRect(0, 0, canvas.width, canvas.height)
    if (kind === 'nearby') { context.fillStyle = '#6597c9'; context.fillRect(48, 0, 16, 128) }
    if (kind === 'texture') for (let x = 0; x < canvas.width; x++) {
      context.fillStyle = ['#c92c3d', '#247acb', '#dbd7c3', '#282531'][x % 4]
      context.fillRect(x, 0, 1, canvas.height)
    }
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(value => resolve(value!)))
    return [...new Uint8Array(await blob.arrayBuffer())]
  }, kind)
  return { name: `${kind}.png`, mimeType: 'image/png', buffer: Buffer.from(bytes) }
}

async function jsonDownload(page: Page, selector: string) {
  const event = page.waitForEvent('download')
  await page.locator(selector).click()
  return JSON.parse(fs.readFileSync((await (await event).path())!, 'utf8'))
}

test('preserves original solid RGB and nearby distinct colors through preview and download', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('.workspace input[type=file]')
  await input.setInputFiles(await png(page, 'solid'))
  await expect(page.locator('.swatch-info strong')).toHaveText('#6496c8')
  let tokens = await jsonDownload(page, '.export-actions button:nth-child(2)')
  expect(tokens.palette).toHaveLength(1)
  expect(tokens.palette[0]).toMatchObject({ hex: '#6496c8', share: 1 })
  await page.getByLabel('选择页面背景颜色', { exact: true }).selectOption('#6496c8')
  await expect(page.locator('.preview-web')).toHaveCSS('--preview-bg', '#6496c8')
  await input.setInputFiles(await png(page, 'nearby'))
  await expect(page.locator('.swatch-row')).toHaveCount(2)
  tokens = await jsonDownload(page, '.export-actions button:nth-child(2)')
  expect(tokens.palette.map((color: { hex: string; share: number }) => [color.hex, color.share])).toEqual([['#6496c8', 0.75], ['#6597c9', 0.25]])
  for (let step = 0; step < 4; step++) await page.getByLabel('减少颜色数量', { exact: true }).click()
  await expect(page.locator('.palette-panel')).toHaveAttribute('aria-busy', 'false')
  tokens = await jsonDownload(page, '.export-actions button:nth-child(2)')
  expect(tokens.analysis.requestedColorCount).toBe(2)
})

test('extracts identical resized evidence in single and series modes with versioned provenance', async ({ page }) => {
  await page.goto('/')
  const file = await png(page, 'texture')
  await page.locator('.workspace input[type=file]').setInputFiles(file)
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  const single = await jsonDownload(page, '.export-actions button:nth-child(2)')
  await page.getByRole('button', { name: '系列', exact: true }).click()
  await page.locator('.series-workspace input[type=file]').setInputFiles([file, file])
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await page.getByRole('button', { name: '统一色组', exact: true }).click()
  const series = await jsonDownload(page, '.series-export-actions button:nth-child(2)')
  const differences = series.comparison.comparisons[0].colorDifferences
  expect(differences.every((difference: { type: string }) => difference.type === 'shared')).toBe(true)
  expect(differences.map((difference: { primary: { hex: string; share: number } }) => ({ hex: difference.primary.hex, share: Number(difference.primary.share.toFixed(6)) })))
    .toEqual(single.palette.map((color: { hex: string; share: number }) => ({ hex: color.hex, share: color.share })))
  expect(single.analysis).toMatchObject({ version: '2.0.0', maxEdge: 512, alphaCutoff: 128, requestedColorCount: 6 })
  expect(series.sourceAnalysis).toHaveLength(2)
  expect(series.sourceAnalysis.every((source: { analysis: unknown }) => JSON.stringify(source.analysis) === JSON.stringify(single.analysis))).toBe(true)
})

test('keeps successful batch images around a corrupt item and accepts a later retry', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '系列', exact: true }).click()
  const input = page.locator('.series-workspace input[type=file]')
  await input.setInputFiles([
    { name: 'palette-test.png', mimeType: 'image/png', buffer: fs.readFileSync('tests/fixtures/palette-test.png') },
    { name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image') },
    { name: 'monochrome-test.png', mimeType: 'image/png', buffer: fs.readFileSync('tests/fixtures/monochrome-test.png') },
  ])
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await expect(page.locator('.series-import-results')).toContainText('成功导入 2 张')
  await expect(page.locator('.series-import-results')).toContainText('broken.png')
  await expect(page.locator('.series-import-results')).toContainText('无法读取图片')
  await expect(page.getByRole('button', { name: '继续添加', exact: true })).toBeEnabled()
  await input.setInputFiles(path.resolve('tests/fixtures/palette-test.png'))
  await expect(page.locator('.series-thumbnail')).toHaveCount(3)
  await expect(page.locator('.series-import-results')).not.toContainText('broken.png')
})

test('keeps an existing unified draft when every new batch item fails', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '系列', exact: true }).click()
  const input = page.locator('.series-workspace input[type=file]')
  const fixture = path.resolve('tests/fixtures/palette-test.png')
  await input.setInputFiles([fixture, fixture])
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await page.getByRole('button', { name: '统一色组', exact: true }).click()
  const background = page.locator('.series-unify').getByLabel('选择页面背景颜色', { exact: true })
  await background.selectOption('#4a90e2')
  await input.setInputFiles([{ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image') }])
  await expect(page.locator('.series-import-results')).toContainText('成功导入 0 张')
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await expect(background).toHaveValue('#4a90e2')
})
