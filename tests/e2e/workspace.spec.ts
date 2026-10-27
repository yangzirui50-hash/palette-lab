import { expect, test } from '@playwright/test'
import path from 'node:path'

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
