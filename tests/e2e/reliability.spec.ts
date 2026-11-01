import { expect, test } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

const simpleFixture = path.resolve('tests/fixtures/palette-test.png')
const nightFixture = path.resolve('tests/fixtures/night-city-test.png')
const personFixture = path.resolve('tests/fixtures/person-test.png')

test('recovers from empty, oversized and unsupported inputs without reload', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles({ name: 'empty.png', mimeType: 'image/png', buffer: Buffer.alloc(0) })
  await expect(page.locator('.error-message')).toContainText('图片文件为空')
  await page.locator('input[type=file]').setInputFiles({ name: 'oversized.png', mimeType: 'image/png', buffer: Buffer.alloc(15 * 1024 * 1024 + 1) })
  await expect(page.locator('.error-message')).toContainText('不能超过 15 MB')
  await page.locator('input[type=file]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') })
  await expect(page.locator('.error-message')).toContainText('请选择 PNG、JPG 或 WebP')
  await page.locator('input[type=file]').setInputFiles(simpleFixture)
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  await expect(page.locator('.error-message')).toHaveCount(0)
})

test('keeps the current result coherent through repeated source and mode changes', async ({ page }) => {
  await page.goto('/')
  const sources = [nightFixture, personFixture, simpleFixture, nightFixture, simpleFixture]
  for (const source of sources) {
    await page.locator('input[type=file]').setInputFiles(source)
    await expect(page.locator('.spatial-preview img')).toBeVisible()
    await expect(page.locator('.spatial-palette-heading')).toContainText('全局色板')
    await expect(page.locator('.spatial-roi')).toHaveCount(0)
    await page.getByRole('button', { name: 'Art / Poster' }).click()
    await expect(page.locator('.preview-poster')).toBeVisible()
    await expect(page.locator('.preview-poster img')).toHaveCount(0)
    await page.getByRole('button', { name: '散点分布', exact: true }).click()
    await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /色彩密度热图/)
    await page.getByRole('button', { name: '连续区域', exact: true }).click()
    await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /颜色区域高亮/)
    await page.getByRole('button', { name: 'Web / UI' }).click()
    await expect(page.locator('.preview-web')).toBeVisible()
  }
  await expect(page.locator('.error-message')).toHaveCount(0)
})

test('supports keyboard details and narrow/tablet layouts without unnamed controls or overflow', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(simpleFixture)
  await expect(page.locator('.spatial-facts-core')).toBeVisible()
  const unnamed = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('button, select, summary, a[href]')]
    .filter((element) => element.offsetParent !== null)
    .filter((element) => !(element.textContent || '').trim() && !element.getAttribute('aria-label') && !element.getAttribute('title'))
    .map((element) => element.outerHTML))
  expect(unnamed).toEqual([])
  const summary = page.getByText('查看结构详情', { exact: true })
  await summary.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.spatial-advanced')).toHaveAttribute('open', '')
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)
  }
})

test('exports a real Art poster PNG without embedding the source image', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(simpleFixture)
  await page.getByRole('button', { name: 'Art / Poster' }).click()
  await expect(page.locator('.poster-main-form')).toBeVisible()
  const downloadEvent = page.waitForEvent('download')
  await page.locator('.export-actions button').nth(2).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('palette-lab-art-poster.png')
  expect(fs.statSync(await download.path()).size).toBeGreaterThan(1000)
  fs.copyFileSync(await download.path(), 'test-results/export-art.png')
})
