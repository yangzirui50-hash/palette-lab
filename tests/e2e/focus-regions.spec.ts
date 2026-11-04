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
  await expect(page.locator('.attention-panel')).toHaveAttribute('data-focus-version', '1.2.0-prototype')
  await expect(page.locator('.attention-panel summary')).toContainText('候选不足，暂不定位')
  await page.locator('.attention-panel summary').click()
  await expect(page.locator('.attention-image')).toHaveAttribute('data-focus-state', 'uncertain')
  await expect(page.locator('.attention-marker')).toHaveCount(0)
  await expect(page.locator('.attention-panel')).toContainText('不等于图像没有视觉重点')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  expect(errors).toEqual([])
})

test('keeps independent strong targets without inventing connectivity from a faint painted bridge', async ({ page }) => {
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
  await expect(page.locator('.attention-panel summary')).toContainText('多处局部反差')
  await page.locator('.attention-panel summary').click()
  await expect(page.locator('.attention-marker')).toHaveCount(2)
  await expect(page.locator('.attention-region')).toHaveCount(0)
  await page.getByRole('button',{name:'显示反差证据',exact:true}).click()
  // The drawn gray connector falls below measured support after contrast
  // normalization. It must not be filled just because it connects in RGB.
  await expect(page.locator('.attention-region')).toHaveCount(2)
  const positions = await page.locator('.attention-marker').evaluateAll(elements => elements.map(element => Number.parseFloat((element as HTMLElement).style.left)))
  expect(Math.min(...positions)).toBeLessThan(30); expect(Math.max(...positions)).toBeGreaterThan(70)
  await expect(page.locator('.attention-panel')).toContainText('不是物体边界')
  await expect(page.locator('.attention-panel')).toContainText('多个标记不代表多个主体')
})

test('defaults to unpainted source pixels, exposes outline evidence on demand and resets on replacement', async ({page}) => {
  await page.goto('/'); await expect(page.locator('.workspace')).toBeVisible()
  await page.evaluate(async()=>{
    const canvas=document.createElement('canvas'); canvas.width=canvas.height=128
    const context=canvas.getContext('2d')!
    context.fillStyle='#5a5a5a'; context.fillRect(0,0,128,128)
    context.strokeStyle='#f0f0f0'; context.lineWidth=6; context.strokeRect(24,24,80,80)
    const blob=await new Promise<Blob>(resolve=>canvas.toBlob(blob=>resolve(blob!)))
    const transfer=new DataTransfer(); transfer.items.add(new File([blob],'hollow-outline.png',{type:'image/png'}))
    const input=document.querySelector<HTMLInputElement>('.workspace input[type=file]')!
    input.files=transfer.files; input.dispatchEvent(new Event('change',{bubbles:true}))
  })
  await expect(page.locator('.attention-panel summary')).toContainText('区域或轮廓响应')
  await page.locator('.attention-panel summary').click()
  await expect(page.locator('.attention-region')).toHaveCount(0)
  const source=await page.locator('.attention-image img').getAttribute('src')
  const borderPixel=async()=>page.locator('.attention-image img').evaluate(async element=>{
    const image=element as HTMLImageElement;await image.decode()
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight
    const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0)
    return [...ctx.getImageData(24,64,1,1).data]
  })
  expect(await borderPixel()).toEqual([240,240,240,255])
  await page.getByRole('button',{name:'显示反差证据',exact:true}).focus()
  await page.keyboard.press('Space')
  await expect(page.locator('.attention-region')).toHaveCount(1)
  await expect(page.locator('.attention-marker')).toHaveCount(0)
  await expect(page.locator('.attention-region')).toHaveAttribute('data-response-geometry','outline')
  await expect(page.locator('.attention-panel')).toContainText('不强行选一个中心点')
  expect(await borderPixel()).not.toEqual([240,240,240,255])
  await page.getByRole('button',{name:'收起反差证据',exact:true}).click()
  await expect(page.locator('.attention-region')).toHaveCount(0)
  await expect(page.locator('.attention-image img')).toHaveAttribute('src',source!)
  expect(await borderPixel()).toEqual([240,240,240,255])
  await page.getByRole('button',{name:'显示反差证据',exact:true}).click()
  await page.locator('.workspace input[type=file]').setInputFiles('tests/fixtures/palette-test.png')
  await expect(page.locator('.source-meta strong')).toHaveText('palette-test.png')
  await expect(page.getByRole('button',{name:'显示反差证据',exact:true,includeHidden:true})).toHaveAttribute('aria-pressed','false')
  await expect(page.locator('.attention-region')).toHaveCount(0)
  await page.setViewportSize({width:390,height:844})
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false)
})
