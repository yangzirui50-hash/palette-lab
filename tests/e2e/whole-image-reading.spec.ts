import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import fs from 'node:fs'

// Independent test users must not share the local production rate-limit bucket.
// Keep the actual six-per-minute limiter enabled; route tests verify its gate.
test.beforeEach(async ({ page }, info) => {
  await page.setExtraHTTPHeaders({ 'cf-connecting-ip': `198.51.100.${1 + info.line % 250}` })
})

async function importImage(page: Page, name = 'palette-test.png') {
  await page.locator('.workspace input[type=file]').setInputFiles(`tests/fixtures/${name}`)
  await expect(page.locator('.source-meta strong')).toHaveText(name)
  await expect(page.locator('.spatial-preview img')).toBeVisible()
}
const analyze = (page: Page) => page.getByRole('button', { name: /^(生成整体解读|重新解读原图)$/ }).click()
const saved = (page: Page) => expect(page.locator('.project-save-state')).toHaveAttribute('data-save-state', 'saved')
async function backup(page: Page, file: string) {
  const event = page.waitForEvent('download'); await page.getByRole('button', { name: '导出项目备份', exact: true }).click()
  await (await event).saveAs(file)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

test('defaults to whole-image reading with one explicit call and reuses it through editing, ROI, reload and backup', async ({ page, browser }, info) => {
  const requests: string[] = [], errors: string[] = []
  page.on('request', request => { if (/\/api\/(reading|focus|analysis)$/.test(request.url())) requests.push(new URL(request.url()).pathname) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/'); await importImage(page)
  await expect(page.getByRole('button', { name: '生成整体解读', exact: true })).toBeVisible()
  await expect(page.locator('.optional-focus')).not.toHaveAttribute('open')
  expect(requests).toEqual([])
  await analyze(page)
  await expect(page.locator('.whole-image-reading')).toBeVisible()
  await expect(page.locator('.reading-local-cues')).not.toHaveAttribute('open')
  await expect(page.locator('.reading-relations')).not.toHaveAttribute('open')
  await expect(page.locator('.reading-original')).toBeVisible()
  await expect(page.locator('.whole-image-reading svg,.whole-image-reading canvas,.whole-image-reading .semantic-focus-bound')).toHaveCount(0)
  const text = await page.locator('.reading-organization').textContent()
  await page.locator('.reading-local-cues>summary').click()
  await expect(page.locator('.reading-local-cues')).toContainText('高亮测试色块')
  await page.getByLabel('增加颜色数量', { exact: true }).click()
  await page.getByRole('button', { name: 'Art / Poster', exact: true }).click()
  await page.getByLabel('选择海报底色颜色', { exact: true }).selectOption('#4a90e2')
  await page.locator('.spatial-roi-actions button').first().click()
  await page.locator('.spatial-image-stage').scrollIntoViewIfNeeded()
  const box = await page.locator('.spatial-image-stage').boundingBox(); if (!box) throw Error('Missing ROI stage')
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .2); await page.mouse.down()
  await page.mouse.move(box.x + box.width * .65, box.y + box.height * .65); await page.mouse.up()
  await expect(page.locator('.spatial-palette-heading')).toContainText('局部色板')
  await expect(page.locator('.reading-organization')).toHaveText(text!)
  await saved(page); await page.reload()
  await expect(page.locator('.whole-image-reading')).toBeVisible()
  await expect(page.locator('.reading-local-cues')).not.toHaveAttribute('open')
  expect(requests).toEqual(['/api/reading'])
  const file = info.outputPath('reading-backup.json'), exported = await backup(page, file)
  expect(exported.project.core.single.readingSnapshots).toHaveLength(1)
  expect(exported.project.core.single.readingSnapshots[0].task).toBe('whole-image-reading')
  expect(exported.project.core.single.focusSnapshots).toHaveLength(0)
  const context = await browser.newContext()
  try {
    const restored = await context.newPage(); await restored.goto('http://127.0.0.1:7101/')
    await restored.getByLabel('打开本地项目备份', { exact: true }).setInputFiles(file)
    await expect(restored.locator('.reading-organization')).toHaveText(text!)
    await expect(restored.locator('.reading-original')).toBeVisible()
    await expect(restored.getByLabel('选择海报底色颜色', { exact: true })).toHaveValue('#4a90e2')
  } finally { await context.close() }
  expect(errors).toEqual([])
})

test('imports a legacy focus-only backup without relabeling it and keeps both histories in a new backup', async ({ page, browser }, info) => {
  await page.goto('/'); await importImage(page)
  await page.locator('.optional-focus>summary').click()
  await page.getByRole('button', { name: '分析主体与主次', exact: true }).click()
  await expect(page.locator('.semantic-focus')).toBeVisible()
  const legacy = await backup(page, info.outputPath('legacy-source.json'))
  const originalFocus = legacy.project.core.single.focusSnapshots
  delete legacy.project.core.single.readingSnapshots
  const context = await browser.newContext()
  try {
    const restored = await context.newPage(), calls: string[] = []
    restored.on('request', request => { if (/\/api\/(reading|focus)$/.test(request.url())) calls.push(new URL(request.url()).pathname) })
    await restored.goto('http://127.0.0.1:7101/')
    await restored.getByLabel('打开本地项目备份', { exact: true }).setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacy)) })
    await expect(restored.locator('[data-reading-status=not-analyzed]')).toBeVisible()
    await expect(restored.locator('.optional-focus')).not.toHaveAttribute('open')
    await restored.locator('.optional-focus>summary').click()
    await expect(restored.locator('.semantic-focus')).toContainText('高亮测试色块')
    expect(calls).toEqual([])
    await analyze(restored)
    await expect(restored.locator('.whole-image-reading')).toBeVisible()
    const exported = await backup(restored, info.outputPath('both-histories.json'))
    expect(exported.project.core.single.focusSnapshots).toEqual(originalFocus)
    expect(exported.project.core.single.readingSnapshots).toHaveLength(1)
    expect(calls).toEqual(['/api/reading'])
  } finally { await context.close() }
})

test('ignores a late whole-image result after source replacement and preserves the replacement on reload', async ({ page }) => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/reading', async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }).catch(() => {}) })
  await page.goto('/'); await importImage(page)
  const requested = page.waitForRequest('**/api/reading'); await analyze(page); await requested
  await importImage(page, 'monochrome-test.png'); release()
  await expect(page.locator('[data-reading-status=not-analyzed]')).toBeVisible()
  await saved(page); await page.reload()
  await expect(page.locator('.source-meta strong')).toHaveText('monochrome-test.png')
  await expect(page.locator('.whole-image-reading')).toHaveCount(0)
})

test('keeps the previous reading and date after a wrong-task or failed refresh', async ({ page }) => {
  await page.goto('/'); await importImage(page); await analyze(page)
  await expect(page.locator('.whole-image-reading time')).toBeVisible()
  const date = await page.locator('.whole-image-reading time').getAttribute('datetime')
  const text = await page.locator('.reading-organization').textContent()
  await page.route('**/api/reading', route => route.fulfill({ json: { task: 'semantic-focus', focus: {} } }))
  await analyze(page)
  await expect(page.locator('.reading-analysis [role=alert]')).toContainText('未通过格式检查')
  await expect(page.locator('.whole-image-reading time')).toHaveAttribute('datetime', date!)
  await expect(page.locator('.reading-organization')).toHaveText(text!)
  await page.unroute('**/api/reading')
  await page.route('**/api/reading', route => route.fulfill({ status: 503, json: { message: '整体解读暂未完成。' } }))
  await analyze(page)
  await expect(page.locator('.reading-analysis [role=alert]')).toContainText('仍保留上次')
  await expect(page.locator('.reading-organization')).toHaveText(text!)
})

test('selects independent reading history, resets detail disclosure and remains usable on a phone', async ({ page }) => {
  let count = 0
  await page.route('**/api/reading', async route => { const response = await route.fetch(), payload = await response.json(); payload.reading.wholeImage.organization = `合成整体记录 ${++count}`; await route.fulfill({ json: payload }) })
  await page.goto('/'); await importImage(page); await analyze(page)
  await expect(page.locator('.reading-organization')).toHaveText('合成整体记录 1')
  await analyze(page)
  await expect(page.locator('.reading-organization')).toHaveText('合成整体记录 2')
  await page.locator('.reading-local-cues>summary').click()
  await page.getByLabel('选择整体解读记录').selectOption({ index: 0 })
  await expect(page.locator('.reading-organization')).toHaveText('合成整体记录 1')
  await expect(page.locator('.reading-local-cues')).not.toHaveAttribute('open')
  await page.locator('.optional-focus>summary').click()
  await page.getByRole('button', { name: '分析主体与主次', exact: true }).click()
  await expect(page.locator('.semantic-focus')).toBeVisible()
  await expect(page.locator('.reading-organization')).toHaveText('合成整体记录 1')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('restores source-owned reading through undo without another analysis request', async ({ page }) => {
  let calls = 0
  page.on('request', request => { if (request.url().endsWith('/api/reading')) calls++ })
  await page.goto('/'); await importImage(page); await analyze(page)
  await expect(page.locator('.whole-image-reading')).toBeVisible()
  const date = await page.locator('.whole-image-reading time').getAttribute('datetime')
  await importImage(page, 'monochrome-test.png')
  await expect(page.locator('[data-reading-status=not-analyzed]')).toBeVisible()
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(page.locator('.source-meta strong')).toHaveText('palette-test.png')
  await expect(page.locator('.whole-image-reading time')).toHaveAttribute('datetime', date!)
  await saved(page); await page.reload()
  await expect(page.locator('.whole-image-reading')).toBeVisible()
  expect(calls).toBe(1)
})
