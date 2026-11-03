import { expect, test } from '@playwright/test'

test('shows fragmented evidence as uncertainty with no fabricated focus markers', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/api/**', route => route.abort())
  await page.goto('/'); await expect(page.locator('.workspace')).toBeVisible()
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128
    const context = canvas.getContext('2d')!
    context.fillStyle = '#5a5a5a'; context.fillRect(0, 0, 128, 128)
    context.fillStyle = '#f0f0f0'
    for (let y = 8; y < 128; y += 20) for (let x = 8; x < 128; x += 20) context.fillRect(x, y, 2, 2)
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!)))
    const transfer = new DataTransfer(); transfer.items.add(new File([blob], 'separate-specks.png', { type: 'image/png' }))
    const input = document.querySelector<HTMLInputElement>('.workspace input[type=file]')!
    input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page.locator('.attention-panel')).toHaveAttribute('data-focus-reason', 'fragmented-response')
  await expect(page.locator('.attention-panel')).toHaveAttribute('data-focus-version', '1.1.0')
  await expect(page.locator('.attention-panel summary')).toContainText('候选不足，暂不定位')
  await page.locator('.attention-panel summary').click()
  await expect(page.locator('.attention-image')).toHaveAttribute('data-focus-state', 'uncertain')
  await expect(page.locator('.attention-marker')).toHaveCount(0)
  await expect(page.locator('.attention-panel')).toContainText('不等于图像没有视觉重点')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  expect(errors).toEqual([])
})

test('keeps independent strong targets on their own measured regions through a faint bridge', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('.workspace')).toBeVisible()
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128
    const context = canvas.getContext('2d')!
    context.fillStyle = '#5a5a5a'; context.fillRect(0, 0, 128, 128)
    context.fillStyle = '#888888'; context.fillRect(28, 60, 72, 8)
    context.fillStyle = '#f0f0f0'; context.fillRect(12, 48, 20, 32); context.fillRect(96, 48, 20, 32)
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!)))
    const transfer = new DataTransfer(); transfer.items.add(new File([blob], 'bridged-targets.png', { type: 'image/png' }))
    const input = document.querySelector<HTMLInputElement>('.workspace input[type=file]')!
    input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page.locator('.attention-panel summary')).toContainText('多焦点')
  await page.locator('.attention-panel summary').click()
  await expect(page.locator('.attention-marker')).toHaveCount(2)
  await expect(page.locator('.attention-region')).toHaveCount(2)
  const positions = await page.locator('.attention-marker').evaluateAll(elements => elements.map(element => Number.parseFloat((element as HTMLElement).style.left)))
  expect(Math.min(...positions)).toBeLessThan(30); expect(Math.max(...positions)).toBeGreaterThan(70)
  await expect(page.locator('.attention-panel')).toContainText('不是物体边界')
})
