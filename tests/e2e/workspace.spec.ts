import { expect, test } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

const fixture = path.resolve('tests/fixtures/palette-test.png')

test('imports an image, extracts colors and changes domain and count', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '色彩工作台' })).toBeVisible()
  await page.locator('input[type=file]').setInputFiles(fixture)
  await expect(page.locator('.swatch-row')).toHaveCount(3)
  await expect(page.locator('.swatch-info strong').first()).toHaveText(/^#[0-9a-f]{6}$/i)
  await expect(page.locator('.swatch-row').first()).toContainText(/50\.[01]%/)
  await page.screenshot({ path: 'test-results/web-light.png', fullPage: true })

  await page.getByRole('button', { name: 'Art / Poster' }).click()
  await expect(page.getByRole('button', { name: 'Art / Poster' })).toHaveClass('active')
  await page.getByRole('button', { name: '增加颜色数量' }).click()
  await expect(page.locator('.count-control output')).toHaveText('7')
  await expect(page.locator('.swatch-row')).toHaveCount(3)
  await page.screenshot({ path: 'test-results/palette-desktop.png', fullPage: true })
})

test('keeps the workspace usable at a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture)
  await expect(page.locator('.swatch-row')).toHaveCount(3)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
  await page.screenshot({ path: 'test-results/palette-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Art / Poster' }).click()
  await expect(page.locator('.poster-main-form')).toBeVisible()
  const artOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(artOverflow).toBe(false)
  await page.locator('.domain-preview').screenshot({ path: 'test-results/art-mobile.png' })
})

test('preserves palette data across theme and domain combinations', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture)
  const originalHex = await page.locator('.swatch-info strong').first().textContent()

  for (const theme of ['light', 'dark']) {
    for (const domain of ['web-ui', 'art-poster']) {
      await page.getByRole('button', { name: domain === 'web-ui' ? 'Web / UI' : 'Art / Poster' }).click()
      const currentTheme = await page.locator('html').getAttribute('data-theme')
      if (currentTheme !== theme) await page.locator('.theme-toggle').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expect(page.locator('html')).toHaveAttribute('data-domain', domain)
      await expect(page.locator('.swatch-info strong').first()).toHaveText(originalHex ?? '')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
      expect(overflow).toBe(false)
      if (domain === 'art-poster') {
        await expect(page.locator('.poster-atmosphere')).toBeVisible()
        await expect(page.locator('.poster-main-form')).toBeVisible()
        await expect(page.locator('.preview-poster img')).toHaveCount(0)
        await page.waitForTimeout(250)
        await page.screenshot({ path: `test-results/art-${theme}.png`, fullPage: true })
      }
    }
  }

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('.theme-toggle')).toContainText('浅色模式')
})

test('copies a palette HEX value with feedback', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture)
  await page.locator('.swatch-row').first().click()
  await expect(page.locator('.swatch-on-color').first()).toHaveText('已复制 ✓')
})

test('shows a useful error for unsupported files', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/not-an-image.txt'))
  await expect(page.getByRole('alert')).toHaveText('请选择 PNG、JPG 或 WebP 图片')
  await expect(page.locator('.swatch-row')).toHaveCount(0)
})

test('edits role colors and updates Web and Poster previews', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture)
  await expect(page.locator('.role-editor')).toBeVisible()
  await expect(page.locator('.preview-web')).toBeVisible()
  await expect(page.locator('.role-field select')).toHaveCount(8)

  const background = page.getByLabel('选择页面背景颜色')
  await background.selectOption({ index: 1 })
  const selected = await background.inputValue()
  await expect(page.locator('.preview-web')).toHaveCSS('--preview-bg', selected)

  await page.getByRole('button', { name: 'Art / Poster' }).click()
  await expect(page.locator('.preview-poster')).toBeVisible()
  await expect(page.locator('.poster-atmosphere')).toBeVisible()
  await expect(page.locator('.preview-poster img')).toHaveCount(0)
  await expect(page.locator('.role-field select')).toHaveCount(6)
  await page.screenshot({ path: 'test-results/poster-preview.png', fullPage: true })
})

test('warns when a role edit makes text unreadable', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture)
  await page.getByLabel('选择主要文字颜色').selectOption({ index: 0 })
  await expect(page.locator('.contrast-report')).toContainText('对比不足')
  await expect(page.locator('.contrast-report')).toContainText('背景与主要文字')
})

test('exports CSS variables, JSON tokens and a real PNG preview', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture)

  const cssEvent = page.waitForEvent('download')
  await page.locator('.export-actions button').nth(0).click()
  const cssDownload = await cssEvent
  expect(cssDownload.suggestedFilename()).toBe('palette-lab-web-ui.css')
  const css = fs.readFileSync(await cssDownload.path(), 'utf8')
  expect(css).toContain('--color-background:')

  const jsonEvent = page.waitForEvent('download')
  await page.locator('.export-actions button').nth(1).click()
  const jsonDownload = await jsonEvent
  expect(jsonDownload.suggestedFilename()).toBe('palette-lab-web-ui.json')
  const tokens = JSON.parse(fs.readFileSync(await jsonDownload.path(), 'utf8'))
  expect(tokens.domain).toBe('web-ui')
  expect(tokens.roles.background).toBeDefined()

  const pngEvent = page.waitForEvent('download')
  await page.locator('.export-actions button').nth(2).click()
  const pngDownload = await pngEvent
  expect(pngDownload.suggestedFilename()).toBe('palette-lab-web-ui.png')
  expect(fs.statSync(await pngDownload.path()).size).toBeGreaterThan(1000)
  fs.copyFileSync(await pngDownload.path(), 'test-results/export-web.png')
})

test('preserves separate role edits when switching between domains', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture)
  const webBackground = page.getByLabel('选择页面背景颜色')
  await webBackground.selectOption({ index: 1 })
  const customWebBackground = await webBackground.inputValue()

  await page.getByRole('button', { name: 'Art / Poster' }).click()
  const posterCanvas = page.getByLabel('选择海报底色颜色')
  await posterCanvas.selectOption({ index: 2 })

  await page.getByRole('button', { name: 'Web / UI' }).click()
  await expect(page.getByLabel('选择页面背景颜色')).toHaveValue(customWebBackground)
  await page.getByRole('button', { name: 'Art / Poster' }).click()
  await expect(page.getByLabel('选择海报底色颜色')).toHaveValue(await posterCanvas.inputValue())
})

test('generates a structured AI analysis through the mock provider', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture)
  await page.getByRole('button', { name: '生成 AI 美学分析' }).click()
  await expect(page.locator('.analysis-summary')).toBeVisible()
  await expect(page.locator('.analysis-summary h3')).toContainText('深色')
  await expect(page.locator('.analysis-recommendations')).toContainText('限制强调色比例')
  await expect(page.locator('.analysis-uncertainty')).toContainText('测试图没有真实语义主体')
  await page.screenshot({ path: 'test-results/ai-analysis.png', fullPage: true })
})

test('returns attributed references and comparison after analysis', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture)
  await page.getByRole('button', { name: '生成 AI 美学分析' }).click()
  await expect(page.locator('.analysis-summary')).toBeVisible()
  await page.getByRole('button', { name: '生成参考图与对比' }).click()
  await expect(page.locator('.reference-card')).toHaveCount(3)
  await expect(page.locator('.inspiration-query')).toContainText('Mock / 测试素材')
  await expect(page.locator('.comparison-summary')).toBeVisible()
  await expect(page.locator('.reference-card').first()).toContainText('借鉴')
  await page.screenshot({ path: 'test-results/inspiration.png', fullPage: true })
})

test('manages a series and preserves independent roles and single-image state', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture)
  await expect(page.locator('.swatch-row')).toHaveCount(3)
  await page.getByRole('button', { name: '系列', exact: true }).click()
  await page.locator('.series-workspace input[type=file]').setInputFiles([fixture, fixture])
  await expect(page.locator('.workspace')).toBeHidden()
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await expect(page.locator('.shared-color-grid article')).toHaveCount(3)
  await expect(page.locator('.deviation-list > article')).toContainText('0 项角色差异')

  await page.getByRole('button', { name: '检查图片：palette-test.png' }).nth(1).click()
  await page.locator('.series-workspace').getByLabel('选择行动强调颜色').selectOption('#4a90e2')
  await page.getByRole('button', { name: 'Art / Poster' }).click()
  await expect(page.locator('.series-workspace').getByLabel('选择点缀色颜色')).toHaveValue('#dfff4f')
  await page.getByRole('button', { name: 'Web / UI' }).click()
  await expect(page.locator('.series-workspace').getByLabel('选择行动强调颜色')).toHaveValue('#4a90e2')
  await page.getByRole('button', { name: '系列总览' }).click()
  await expect(page.locator('.deviation-list > article')).toContainText('1 项角色差异')
  await expect(page.locator('.deviation-list > article')).toContainText('accent')
  await page.screenshot({ path: 'test-results/series-overview.png', fullPage: true })

  await page.getByRole('button', { name: '单图', exact: true }).click()
  await expect(page.locator('.series-workspace')).toBeHidden()
  await expect(page.locator('.swatch-row')).toHaveCount(3)
  await expect(page.locator('.swatch-row').first()).toContainText(/50\.[01]%/)
})

test('unifies a series with preserved accents and exports production artifacts', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '系列', exact: true }).click()
  await page.locator('.series-workspace input[type=file]').setInputFiles([fixture, fixture])
  await page.getByRole('button', { name: '检查图片：palette-test.png' }).nth(1).click()
  await page.locator('.series-workspace').getByLabel('选择行动强调颜色').selectOption('#4a90e2')
  await page.getByRole('button', { name: '锁定行动强调' }).click()
  await page.getByRole('button', { name: '统一色组' }).click()
  await expect(page.getByRole('button', { name: '保留个性', exact: false })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.series-exceptions')).toContainText('accent #4a90e2')
  await expect(page.locator('.series-export')).toContainText('4 组对比不足')
  await expect(page.locator('.series-export')).toContainText('仍可导出当前颜色，建议先修正')
  await expect(page.locator('.series-export-audit')).toHaveAttribute('data-contrast-status', 'failed')
  await page.screenshot({ path: 'test-results/series-unified.png', fullPage: true })

  const cssEvent = page.waitForEvent('download')
  await page.locator('.series-export-actions button').nth(0).click()
  const cssDownload = await cssEvent
  expect(cssDownload.suggestedFilename()).toBe('palette-lab-series-preserve-accents.css')
  expect(fs.readFileSync(await cssDownload.path(), 'utf8')).toContain('--color-accent: #dfff4f;')

  const jsonEvent = page.waitForEvent('download')
  await page.locator('.series-export-actions button').nth(1).click()
  const jsonDownload = await jsonEvent
  const tokens = JSON.parse(fs.readFileSync(await jsonDownload.path(), 'utf8'))
  expect(tokens.strategy).toBe('preserve-accents')
  expect(tokens.roles.accent).toBe('#dfff4f')
  expect(Object.values(tokens.exceptions)[0]).toEqual({ accent: '#4a90e2' })

  const reportEvent = page.waitForEvent('download')
  await page.locator('.series-export-actions button').nth(2).click()
  const reportDownload = await reportEvent
  const report = JSON.parse(fs.readFileSync(await reportDownload.path(), 'utf8'))
  expect(report.$schema).toBe('https://palette-lab.3476554092.workers.dev/schemas/series-report/v1.json')
  expect(report.unifiedRoles.accent).toBe('#dfff4f')

  const pngEvent = page.waitForEvent('download')
  await page.locator('.series-export-actions button').nth(3).click()
  const pngDownload = await pngEvent
  expect(pngDownload.suggestedFilename()).toBe('palette-lab-series-preserve-accents.png')
  expect(fs.statSync(await pngDownload.path()).size).toBeGreaterThan(1000)
  fs.copyFileSync(await pngDownload.path(), 'test-results/series-export.png')
})

test('keeps the series workflow usable at a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: '系列', exact: true }).click()
  await page.locator('.series-workspace input[type=file]').setInputFiles([fixture, fixture])
  await expect(page.locator('.workspace')).toBeHidden()
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await page.getByRole('button', { name: '检查图片：palette-test.png' }).first().click()
  await expect(page.getByRole('heading', { name: '单图检查' })).toBeVisible()
  await page.getByRole('button', { name: '统一色组' }).click()
  await expect(page.getByRole('heading', { name: '选择统一策略' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
  await page.screenshot({ path: 'test-results/series-mobile.png', fullPage: true })
})

test('highlights spatial color regions with explainable evidence', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture)
  await expect(page.getByRole('heading', { name: '视觉重心与色彩地图' })).toBeVisible()
  await expect(page.locator('.spatial-facts-core')).toBeVisible()
  await page.locator('.spatial-swatches button').nth(2).click()
  await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /#4a90e2/)
  await expect(page.locator('.spatial-facts-core')).toContainText('18.8%')
  await expect(page.locator('.spatial-facts-core')).toContainText('右侧')
  await expect(page.locator('.spatial-facts-core')).toContainText('连续完整性')
  await expect(page.locator('.spatial-facts-core')).toContainText('视觉显著度')
  await expect(page.locator('.spatial-facts-core')).toContainText('区分度')
  await expect(page.locator('.spatial-facts-core')).toContainText('100.0%')
  await page.getByText('查看结构详情', { exact: true }).click()
  await expect(page.getByText('中心区域占比', { exact: true })).toBeVisible()
  await expect(page.getByText('空间跨度', { exact: true })).toBeVisible()
  await expect(page.locator('.spatial-mode')).toContainText('近似色区域，不是物体分割')
  await expect(page.locator('.spatial-mode button')).toHaveText('全部近似色区域')
  await page.locator('.spatial-mode button').click()
  await expect(page.locator('.spatial-mode button')).toHaveText('仅最大连续区域')
  await page.locator('.spatial-mode button').click()
  await expect(page.locator('.spatial-mode button')).toHaveText('全部近似色区域')
  await page.screenshot({ path: 'test-results/spatial-evidence.png', fullPage: true })
  await page.locator('.spatial-roi-actions button').first().click()
  const preview = await page.locator('.spatial-image-stage').boundingBox()
  if (!preview) throw new Error('Spatial image stage not found')
  await page.mouse.move(preview.x + preview.width * 0.83, preview.y + preview.height * 0.1)
  await page.mouse.down()
  await page.mouse.move(preview.x + preview.width * 0.99, preview.y + preview.height * 0.9, { steps: 8 })
  await page.mouse.up()
  await expect(page.locator('.spatial-roi')).toBeVisible()
  await expect(page.locator('.spatial-palette-heading')).toContainText('局部色板')
  await expect(page.locator('.spatial-swatches button')).toHaveCount(1)
  await expect(page.locator('.spatial-swatches button').first()).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.swatch-row')).toHaveCount(3)
  await expect(page.locator('.spatial-facts-core')).toContainText('可信匹配面积100.0%')
  await page.locator('.spatial-panel').screenshot({ path: 'test-results/spatial-local-palette.png' })
  await page.getByRole('button', { name: '散点分布', exact: true }).click()
  await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /色彩密度热图/)
  await expect(page.locator('.spatial-palette-heading')).toContainText('局部色板')
})

test('shows multi-scale distribution evidence for scattered neon lights', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/neon-test.png'))
  await expect(page.getByRole('heading', { name: '视觉重心与色彩地图' })).toBeVisible()
  await page.getByRole('button', { name: '散点分布', exact: true }).click()
  await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /色彩密度热图/)
  await expect(page.locator('.spatial-facts')).toContainText('所选颜色热点位置')
  await expect(page.locator('.spatial-facts')).toContainText('热点能量占比')
  await expect(page.locator('.spatial-facts')).toContainText('密度＋局部反差')
  const hotspotCount = await page.locator('.spatial-facts > div').nth(2).locator('strong').textContent()
  expect(Number(hotspotCount)).toBeGreaterThan(0)
  await page.locator('.spatial-panel').screenshot({ path: 'test-results/neon-distribution.png' })
  await page.getByRole('button', { name: '连续区域', exact: true }).click()
  await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /颜色区域高亮/)
  await page.setViewportSize({ width: 390, height: 844 })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})
