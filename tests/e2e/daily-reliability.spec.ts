import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const fixture = path.resolve('tests/fixtures/palette-test.png')

test('recovers when clipboard permission and the legacy copy command are denied', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError') } } })
    document.execCommand = () => { throw new DOMException('Legacy denied', 'SecurityError') }
  })
  await page.goto('/'); await page.locator('.workspace input[type=file]').setInputFiles(fixture)
  await page.locator('.swatch-row').first().click()
  await expect(page.locator('.error-message')).toContainText('无法自动复制，请手动复制 #0a0a0a')
  await expect(page.locator('textarea')).toHaveCount(0)
  expect(errors).toEqual([])
  await expect(page.locator('.single-results .role-editor')).toBeVisible()
})

test('restores focused input selection when clipboard access itself throws', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('.workspace')).toBeVisible()
  const result = await page.evaluate(async () => {
    const { copyText } = await import('/src/lib/clipboard.ts')
    const input = document.createElement('input'); input.value = '#123456'; document.body.append(input)
    input.focus(); input.setSelectionRange(1, 4)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => { throw new DOMException('Denied', 'SecurityError') } })
    document.execCommand = () => false
    let copied: boolean | null = null, error: string | null = null
    try { copied = await copyText('#abcdef') } catch (reason) { error = String(reason) }
    const value = { copied, error, focus: document.activeElement === input, start: input.selectionStart, end: input.selectionEnd, leftovers: document.querySelectorAll('textarea').length }
    input.remove(); return value
  })
  expect(result).toEqual({ copied: false, error: null, focus: true, start: 1, end: 4, leftovers: 0 })
})

test('uses successful legacy copy after a denied modern clipboard request', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError') } } })
    document.execCommand = () => true
  })
  await page.goto('/'); await page.locator('.workspace input[type=file]').setInputFiles(fixture)
  await page.locator('.swatch-row').first().click()
  await expect(page.locator('.swatch-on-color').first()).toHaveText('已复制 ✓')
  await expect(page.locator('textarea')).toHaveCount(0)
})

test('exports all six locked-image exceptions with complete wrapped long names', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '系列', exact: true }).click()
  const names = Array.from({ length: 6 }, (_, index) => `第${index + 1}张_${'这是一段较长的作品名称用于检查导出是否完整'.repeat(5)}.png`)
  await page.locator('.series-workspace input[type=file]').setInputFiles(names.map(name => ({ name, mimeType: 'image/png', buffer: fs.readFileSync(fixture) })))
  await expect(page.locator('.series-thumbnail')).toHaveCount(6)
  for (const name of names) {
    await page.getByRole('button', { name: `检查图片：${name}`, exact: true }).click()
    await page.getByRole('button', { name: '锁定页面背景', exact: true }).click()
  }
  await page.getByRole('button', { name: '统一色组', exact: true }).click()
  const editor = page.locator('.series-unify')
  await editor.getByRole('button', { name: '自定义页面背景颜色', exact: true }).click()
  await editor.getByLabel('输入页面背景HEX', { exact: true }).fill('#123456')
  await editor.getByRole('button', { name: '应用页面背景色值', exact: true }).click()
  await page.evaluate(() => {
    const original = CanvasRenderingContext2D.prototype.fillText
    Object.assign(window, { seriesDraws: [] })
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      if (this.canvas.width === 1600) (window as unknown as { seriesDraws: unknown[] }).seriesDraws.push({ text, x, y, width: this.measureText(text).width, height: this.canvas.height })
      if (maxWidth === undefined) original.call(this, text, x, y)
      else original.call(this, text, x, y, maxWidth)
    }
  })
  const event = page.waitForEvent('download'); await page.locator('.series-export-actions button').nth(3).click()
  await (await event).saveAs('test-results/series-complete.png')
  const draws = await page.evaluate(() => (window as unknown as { seriesDraws: Array<{ text: string; x: number; y: number; width: number; height: number }> }).seriesDraws)
  const text = draws.map(draw => draw.text).join('')
  for (const name of names) expect(text).toContain(name)
  expect(text).toContain('background #0a0a0a')
  expect(draws.every(draw => draw.x + draw.width <= 1497 && draw.y < draw.height - 40)).toBe(true)
})

test('cleans up a blocked series download and allows a successful retry', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/'); await page.getByRole('button', { name: '系列', exact: true }).click()
  await page.locator('.series-workspace input[type=file]').setInputFiles([fixture, fixture])
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await page.getByRole('button', { name: '统一色组', exact: true }).click()
  await page.evaluate(() => {
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL), click = HTMLAnchorElement.prototype.click
    const state = { created: [] as string[], revoked: [] as string[], blocked: false }
    Object.assign(window, { downloadProbe: state })
    URL.createObjectURL = value => { const url = create(value); state.created.push(url); return url }
    URL.revokeObjectURL = url => { state.revoked.push(url); revoke(url) }
    HTMLAnchorElement.prototype.click = function () {
      if (this.download.endsWith('.png') && !state.blocked) { state.blocked = true; throw new DOMException('Download blocked', 'NotAllowedError') }
      click.call(this)
    }
  })
  const button = page.locator('.series-export-actions button').nth(3)
  await button.click(); await expect(page.locator('.series-export [role=alert]')).toContainText('导出失败')
  await expect(button).toBeEnabled(); await expect(page.locator('a[download]')).toHaveCount(0)
  await page.waitForFunction(() => {
    const state = (window as unknown as { downloadProbe: { created: string[]; revoked: string[] } }).downloadProbe
    return state.created.length === 1 && state.revoked.includes(state.created[0])
  })
  const event = page.waitForEvent('download'); await button.click(); const download = await event
  expect(fs.statSync((await download.path())!).size).toBeGreaterThan(1000)
  await expect(page.locator('.series-export [role=alert]')).toHaveCount(0)
  expect(errors).toEqual([])
})
