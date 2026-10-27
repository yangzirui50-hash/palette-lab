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
  await expect(page.locator('.swatch-row').first()).toContainText('50.0%')
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
