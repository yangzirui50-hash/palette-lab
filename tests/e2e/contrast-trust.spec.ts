import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

test('warns about 12px muted text below 4.5:1 in both preview and export', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 100
    const context = canvas.getContext('2d')!
    ;['#000000', '#666666', '#ffffff'].forEach((color, index) => { context.fillStyle = color; context.fillRect(index * 100, 0, 100, 100) })
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(value => resolve(value!)))
    const transfer = new DataTransfer(); transfer.items.add(new File([blob], 'contrast.png', { type: 'image/png' }))
    const input = document.querySelector<HTMLInputElement>('.workspace input[type=file]')!
    input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  const colors = await page.locator('.swatch-info strong').allTextContents()
  const gray = colors.find(color => !['#000000', '#ffffff'].includes(color.toLowerCase()))!.toLowerCase()
  for (const [label, color] of [['页面背景', '#000000'], ['卡片表面', '#000000'], ['主要文字', '#ffffff'], ['次要文字', gray], ['行动强调', '#ffffff']]) {
    await page.getByLabel(`选择${label}颜色`, { exact: true }).selectOption(color)
  }
  await expect(page.locator('.contrast-report')).toHaveAttribute('data-contrast-status', 'failed')
  await expect(page.locator('.export-audit')).toHaveAttribute('data-contrast-status', 'failed')
  await expect(page.locator('.contrast-report')).toContainText('背景与次要文字')
  await expect(page.locator('.export-audit')).toContainText('对比不足')
  expect(await page.locator('.contrast-report .contrast-audit-summary').textContent()).toBe(await page.locator('.export-audit .contrast-audit-summary').textContent())
  await page.locator('.contrast-report summary').click()
  await expect(page.locator('.contrast-report')).toContainText('至少 4.5:1')
  await page.locator('.domain-preview').screenshot({ path: 'test-results/contrast-warning.png' })
  const downloadEvent = page.waitForEvent('download')
  await page.locator('.export-actions button').nth(1).click()
  const download = await downloadEvent
  const data = JSON.parse(fs.readFileSync((await download.path())!, 'utf8'))
  expect(data.roles.textMuted).toBe(gray)
  expect(data.roles.background).toBe('#000000')
})

test('keeps fallback selectors, painted colors and exported roles consistent', async ({ page }) => {
  await page.goto('/')
  await page.locator('.workspace input[type=file]').setInputFiles(path.resolve('tests/fixtures/palette-test.png'))
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  const muted = page.getByLabel('选择次要文字颜色', { exact: true })
  await expect(muted).toHaveValue('#a3a3a3')
  await expect(muted.locator('option:checked')).toContainText('#a3a3a3')
  await expect(page.locator('.preview-web')).toHaveCSS('--preview-muted', '#a3a3a3')
  await muted.selectOption('#0a0a0a')
  await muted.selectOption('#a3a3a3')
  const mismatch = await page.locator('.role-field').evaluateAll(fields => fields.flatMap(field => {
    const select = field.querySelector('select')!, chip = field.querySelector<HTMLElement>('i')!
    const context = document.createElement('canvas').getContext('2d')!
    context.fillStyle = select.value; const selected = context.fillStyle
    context.fillStyle = chip.style.backgroundColor
    return selected !== context.fillStyle ? [select.getAttribute('aria-label')] : []
  }))
  expect(mismatch).toEqual([])
  const downloadEvent = page.waitForEvent('download')
  await page.locator('.export-actions button').nth(1).click()
  const download = await downloadEvent
  const data = JSON.parse(fs.readFileSync((await download.path())!, 'utf8'))
  expect(data.roles.textMuted).toBe(await muted.inputValue())
})

test('shows all assigned fallback colors in a single-color image in both domains', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 20; canvas.height = 20
    const context = canvas.getContext('2d')!; context.fillStyle = '#0000ff'; context.fillRect(0, 0, 20, 20)
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(value => resolve(value!)))
    const transfer = new DataTransfer(); transfer.items.add(new File([blob], 'single.png', { type: 'image/png' }))
    const input = document.querySelector<HTMLInputElement>('.workspace input[type=file]')!
    input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page.locator('.spatial-preview img')).toBeVisible()
  await expect(page.getByLabel('选择页面背景颜色', { exact: true })).toHaveValue('#101010')
  await expect(page.getByLabel('选择卡片表面颜色', { exact: true })).toHaveValue('#1b1b1b')
  await expect(page.getByLabel('选择主要文字颜色', { exact: true })).toHaveValue('#f2f2f2')
  await page.getByRole('button', { name: 'Art / Poster', exact: true }).click()
  await expect(page.getByLabel('选择海报底色颜色', { exact: true })).toHaveValue('#101010')
  await expect(page.getByLabel('选择展示标题颜色', { exact: true })).toHaveValue('#f2f2f2')
  await expect(page.getByLabel('选择正文文字颜色', { exact: true })).toHaveValue('#a3a3a3')
})

test('shares the same audit state between a series preview and its export', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '系列', exact: true }).click()
  const fixture = path.resolve('tests/fixtures/palette-test.png')
  await page.locator('.series-workspace input[type=file]').setInputFiles([fixture, fixture])
  await expect(page.locator('.series-thumbnail')).toHaveCount(2)
  await page.getByRole('button', { name: '统一色组', exact: true }).click()
  const preview = page.locator('.series-unify .contrast-report')
  const output = page.locator('.series-export-audit')
  await expect(preview).toHaveAttribute('data-contrast-status', 'failed')
  expect(await preview.locator('.contrast-audit-summary').textContent()).toBe(await output.locator('.contrast-audit-summary').textContent())
  expect(await preview.getAttribute('data-contrast-status')).toBe(await output.getAttribute('data-contrast-status'))
})
