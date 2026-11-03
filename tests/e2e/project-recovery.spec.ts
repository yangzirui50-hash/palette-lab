import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const fixture = path.resolve('tests/fixtures/palette-test.png')
const monochrome = path.resolve('tests/fixtures/monochrome-test.png')
const pageErrors = new WeakMap<Page, string[]>()
test.beforeEach(({ page }) => {
  const errors: string[] = []; pageErrors.set(page, errors)
  page.on('pageerror', error => errors.push(error.message))
})
test.afterEach(({ page }) => { expect(pageErrors.get(page)).toEqual([]) })
const saved = (page: Page) => expect(page.locator('.project-save-state')).toHaveAttribute('data-save-state', 'saved', { timeout: 10000 })
async function importSingle(page: Page) {
  await page.locator('.workspace input[type=file]').setInputFiles(fixture)
  await expect(page.locator('.spatial-preview img')).toBeVisible()
}
async function background(page: Page, hex: string) {
  await page.getByLabel('选择页面背景颜色', { exact: true }).selectOption(hex)
}
async function backup(page: Page, filename: string) {
  const event = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出项目备份', exact: true }).click()
  const download = await event
  await download.saveAs(filename)
  return JSON.parse(fs.readFileSync(filename, 'utf8'))
}

test('restores the image, count and independent domain choices after reload', async ({ page }) => {
  await page.goto('/'); await importSingle(page); await background(page, '#4a90e2')
  await page.getByRole('button', { name: 'Art / Poster', exact: true }).click()
  await page.getByLabel('选择海报底色颜色', { exact: true }).selectOption('#dfff4f')
  for (let i = 0; i < 4; i++) await page.getByLabel('减少颜色数量', { exact: true }).click()
  await expect(page.locator('.palette-panel')).toHaveAttribute('aria-busy', 'false')
  await saved(page); await page.reload()
  await expect(page.locator('.source-meta strong')).toHaveText('palette-test.png')
  await expect(page.locator('.count-control output')).toHaveText('2')
  await expect(page.getByLabel('选择海报底色颜色', { exact: true })).toHaveValue('#dfff4f')
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  await page.getByRole('button', { name: 'Web / UI', exact: true }).click()
  await expect(page.getByLabel('选择页面背景颜色', { exact: true })).toHaveValue('#4a90e2')
  await expect(page.locator('.preview-web')).toHaveCSS('--preview-bg', '#4a90e2')
  await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeDisabled()
})

test('restores series order, primary, source locks, strategy and unified drafts after reload', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '系列', exact: true }).click()
  await page.locator('.series-workspace input[type=file]').setInputFiles([fixture, monochrome])
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await page.getByRole('button', { name: '检查图片：palette-test.png', exact: true }).click()
  await page.getByRole('button', { name: '锁定页面背景', exact: true }).click()
  await page.getByRole('button', { name: '统一色组', exact: true }).click()
  await page.getByRole('button', { name: '跟随主图', exact: false }).click()
  await page.locator('.series-unify').getByLabel('选择页面背景颜色', { exact: true }).selectOption('#4a90e2')
  await page.getByRole('button', { name: '设为主图', exact: true }).nth(1).click()
  await page.getByLabel('前移 monochrome-test.png', { exact: true }).click()
  await saved(page); await page.reload()
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await expect(page.locator('.series-thumbnail .thumbnail-meta strong')).toHaveText(['monochrome-test.png', 'palette-test.png'])
  await expect(page.locator('.series-thumbnail').first()).toHaveClass(/primary/)
  await expect(page.getByRole('button', { name: '跟随主图', exact: false })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.series-unify').getByLabel('选择页面背景颜色', { exact: true })).toHaveValue('#4a90e2')
  await expect(page.locator('.series-exceptions')).toContainText('background #0a0a0a')
  await page.getByRole('button', { name: '检查图片：palette-test.png', exact: true }).click()
  await expect(page.getByRole('button', { name: '解锁页面背景', exact: true })).toBeVisible()
})

test('round-trips a full project backup into a fresh browser context', async ({ page, browser }, info) => {
  await page.goto('/'); await importSingle(page); await background(page, '#4a90e2')
  await page.getByRole('button', { name: '系列', exact: true }).click()
  await page.locator('.series-workspace input[type=file]').setInputFiles([fixture, monochrome])
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  const filename = info.outputPath('project.palette-project.json')
  const exported = await backup(page, filename)
  expect(exported.format).toBe('palette-lab-project')
  expect(exported.project.core.single.source.file.data.length).toBeGreaterThan(100)
  const context = await browser.newContext()
  try {
    const restored = await context.newPage(); await restored.goto('http://127.0.0.1:7101/')
    await restored.getByLabel('打开本地项目备份', { exact: true }).setInputFiles(filename)
    await expect(restored.locator('.series-thumbnail')).toHaveCount(2)
    await expect(restored.locator('.series-thumbnail img')).toHaveCount(2)
    await restored.getByRole('button', { name: '单图', exact: true }).click()
    await expect(restored.locator('.source-meta strong')).toHaveText('palette-test.png')
    await expect(restored.getByLabel('选择页面背景颜色', { exact: true })).toHaveValue('#4a90e2')
    await expect(restored.locator('.spatial-preview img')).toBeVisible()
    await saved(restored); await restored.reload()
    await expect(restored.getByLabel('选择页面背景颜色', { exact: true })).toHaveValue('#4a90e2')
  } finally { await context.close() }
})

test('rejects unsupported or broken-image backups without replacing live work', async ({ page }, info) => {
  await page.goto('/'); await importSingle(page); await background(page, '#4a90e2')
  const exported = await backup(page, info.outputPath('before.json'))
  exported.schemaVersion = 999
  await page.getByLabel('打开本地项目备份', { exact: true }).setInputFiles({ name: 'future.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) })
  await expect(page.locator('.project-error')).toContainText('当前工作未被替换')
  exported.schemaVersion = 1; exported.project.core.single.source.file.data = Buffer.from('not an image').toString('base64')
  await page.getByLabel('打开本地项目备份', { exact: true }).setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) })
  await expect(page.locator('.project-error')).toContainText('校验失败')
  exported.project.core.single.source.file.sha256 = createHash('sha256').update('not an image').digest('hex')
  await page.getByLabel('打开本地项目备份', { exact: true }).setInputFiles({ name: 'broken-valid-hash.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) })
  await expect(page.locator('.project-error')).toContainText('无法读取的图片')
  await expect(page.getByLabel('选择页面背景颜色', { exact: true })).toHaveValue('#4a90e2')
})

test('undoes and redoes source replacement and new-project creation with usable image URLs', async ({ page }) => {
  await page.goto('/'); await importSingle(page); await background(page, '#4a90e2')
  await page.locator('.workspace input[type=file]').setInputFiles(monochrome)
  await expect(page.locator('.source-meta strong')).toHaveText('monochrome-test.png')
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(page.locator('.source-meta strong')).toHaveText('palette-test.png')
  await expect(page.getByLabel('选择页面背景颜色', { exact: true })).toHaveValue('#4a90e2')
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  await page.getByRole('button', { name: '重做', exact: true }).click()
  await expect(page.locator('.source-meta strong')).toHaveText('monochrome-test.png')
  await page.getByRole('button', { name: '新建项目', exact: true }).click()
  await expect(page.locator('.source-meta')).toHaveCount(0)
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(page.locator('.source-meta strong')).toHaveText('monochrome-test.png')
  await expect(page.locator('.spatial-preview img')).toBeVisible()
})

test('persists undo back to the initial empty project rather than resurrecting a saved image', async ({ page }) => {
  await page.goto('/'); await importSingle(page); await saved(page)
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(page.locator('.source-meta')).toHaveCount(0)
  await saved(page); await page.reload()
  await expect(page.locator('.workspace')).toBeVisible()
  await expect(page.locator('.source-meta')).toHaveCount(0)
})

test('undoes a series removal atomically with its primary, lock and unified draft', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '系列', exact: true }).click()
  await page.locator('.series-workspace input[type=file]').setInputFiles([fixture, monochrome])
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await page.getByRole('button', { name: '检查图片：palette-test.png', exact: true }).click()
  await page.getByRole('button', { name: '锁定页面背景', exact: true }).click()
  await page.getByRole('button', { name: '统一色组', exact: true }).click()
  await page.locator('.series-unify').getByLabel('选择页面背景颜色', { exact: true }).selectOption('#4a90e2')
  await page.getByLabel('移除 palette-test.png', { exact: true }).click()
  await expect(page.locator('.series-thumbnail')).toHaveCount(1)
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await expect(page.locator('.series-thumbnail').first()).toHaveClass(/primary/)
  await expect(page.locator('.series-unify').getByLabel('选择页面背景颜色', { exact: true })).toHaveValue('#4a90e2')
  await expect(page.locator('.series-exceptions')).toContainText('background #0a0a0a')
  await expect(page.locator('.series-thumbnail img')).toHaveCount(2)
})

test('preserves analysis snapshots through role and ROI browsing and reload without another API call', async ({ page }) => {
  const analysisRequests: string[] = []
  page.on('request', request => { if (request.url().endsWith('/api/analysis')) analysisRequests.push(request.url()) })
  await page.goto('/'); await importSingle(page)
  await page.getByRole('button', { name: '生成 AI 美学分析', exact: true }).click()
  await expect(page.locator('.analysis-report')).toBeVisible()
  const summary = await page.locator('.analysis-summary h3').textContent()
  await background(page, '#4a90e2')
  await expect(page.locator('.analysis-snapshot-note')).toHaveAttribute('data-snapshot-state', 'historical')
  await page.locator('.spatial-roi-actions button').first().click()
  await page.locator('.spatial-image-stage').scrollIntoViewIfNeeded()
  const stage = await page.locator('.spatial-image-stage').boundingBox()
  if (!stage) throw new Error('Missing region stage')
  await page.mouse.move(stage.x + stage.width * .2, stage.y + stage.height * .2); await page.mouse.down()
  await page.mouse.move(stage.x + stage.width * .6, stage.y + stage.height * .6); await page.mouse.up()
  await expect(page.locator('.spatial-palette-heading')).toContainText('局部色板')
  await expect(page.locator('.analysis-summary h3')).toHaveText(summary!)
  await saved(page); await page.reload()
  await expect(page.locator('.analysis-summary h3')).toHaveText(summary!)
  await expect(page.locator('.spatial-palette-heading')).toContainText('局部色板')
  expect(analysisRequests).toHaveLength(1)
})

test('keeps editing and backups usable when local storage runs out of space', async ({ page }, info) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
      if (this.name === 'projects') throw new DOMException('quota fixture', 'QuotaExceededError')
      return original.call(this, value, key)
    }
  })
  await page.goto('/'); await importSingle(page)
  await expect(page.locator('.project-save-state')).toHaveAttribute('data-save-state', 'error')
  await expect(page.locator('.project-save-state')).toContainText('自动保存失败')
  await background(page, '#4a90e2')
  const exported = await backup(page, info.outputPath('quota-backup.json'))
  expect(exported.project.core.single.roleOverrides['web-ui'].background).toBe('#4a90e2')
  await expect(page.getByRole('button', { name: '重试自动保存', exact: true })).toBeVisible()
})

test('protects an unreadable stored version instead of overwriting it with the empty render', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('.workspace')).toBeVisible()
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('palette-lab-projects', 1)
    request.onsuccess = () => {
      const db = request.result, transaction = db.transaction('projects', 'readwrite')
      transaction.objectStore('projects').put({ schemaVersion: 999, revision: 9, sentinel: 'keep' }, 'current')
      transaction.oncomplete = () => { db.close(); resolve() }; transaction.onerror = () => reject(transaction.error)
    }; request.onerror = () => reject(request.error)
  }))
  await page.reload()
  await expect(page.locator('.project-save-state')).toContainText('自动保存已暂停')
  await importSingle(page); await background(page, '#4a90e2')
  const sentinel = await page.evaluate(() => new Promise<string>((resolve, reject) => {
    const request = indexedDB.open('palette-lab-projects', 1)
    request.onsuccess = () => {
      const db = request.result, transaction = db.transaction('projects'), get = transaction.objectStore('projects').get('current')
      transaction.oncomplete = () => { db.close(); resolve(get.result.sentinel) }; transaction.onerror = () => reject(transaction.error)
    }
  }))
  expect(sentinel).toBe('keep')
})

test('detects concurrent-window edits before overwriting a newer project', async ({ page, context }) => {
  await page.goto('/'); await importSingle(page); await saved(page)
  const other = await context.newPage(); await other.goto('http://127.0.0.1:7101/')
  await expect(other.locator('.source-meta strong')).toHaveText('palette-test.png')
  await background(page, '#4a90e2'); await saved(page)
  await background(other, '#dfff4f')
  await expect(other.locator('.project-save-state')).toHaveAttribute('data-save-state', 'conflict')
  await expect(other.locator('.project-save-state')).toContainText('另一个窗口')
  await expect(other.getByLabel('选择页面背景颜色', { exact: true })).toHaveValue('#dfff4f')
  await page.reload()
  await expect(page.getByLabel('选择页面背景颜色', { exact: true })).toHaveValue('#4a90e2')
  await other.close()
})
