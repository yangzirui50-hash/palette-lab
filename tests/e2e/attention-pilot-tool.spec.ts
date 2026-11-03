import { expect, test } from '@playwright/test'
import fs from 'node:fs'

const template = fs.readFileSync('scripts/templates/attention-pilot.html', 'utf8')
// Synthetic tool QA only: these answers are never copied to the human packet.
const packet = { format: 'palette-lab-attention-pilot', protocol: 'fixture-only', packetId: 'synthetic-tool-qa', split: 'development-pilot', qualification: false, entries: [1, 2].map(id => ({ id: `fixture-${id}`, file: 'fixture.png', sha256: 'synthetic', author: 'Self-generated test fixture', source: 'https://example.invalid/fixture', license: 'test-only', licenseUrl: 'https://example.invalid/fixture' })) }

test('blind annotation tool validates geometry/state, restores drafts and exports explicitly partial work', async ({ page }) => {
  const errors: string[] = [], requests: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('https://pilot.test/**', route => {
    requests.push(route.request().url())
    return route.request().url().includes('/images/') ? route.fulfill({ contentType: 'image/png', body: fs.readFileSync('tests/fixtures/palette-test.png') })
      : route.fulfill({ contentType: 'text/html', body: template.replace('/*__PACKET__*/null', JSON.stringify({ ...packet, reviewer: 'A' })) })
  })
  await page.goto('https://pilot.test/')
  await page.locator('#confirm').click(); await expect(page.locator('#error')).toContainText('请选择')
  await page.getByRole('radio', { name: '单一', exact: true }).check()
  await page.locator('#confirm').click(); await expect(page.locator('#error')).toContainText('1 个框')
  await expect(page.locator('#stage')).toHaveAttribute('data-loaded', 'true')
  const box = (await page.locator('#overlay').boundingBox())!
  await page.mouse.move(box.x + .1 * box.width, box.y + .2 * box.height); await page.mouse.down()
  await page.mouse.move(box.x + .3 * box.width, box.y + .5 * box.height); await page.mouse.up()
  await expect(page.locator('#overlay rect')).toHaveCount(1)
  await page.reload(); await expect(page.locator('#overlay rect')).toHaveCount(1)
  await page.locator('#uncertain').check(); await page.locator('#confirm').click(); await expect(page.locator('#error')).toContainText('不确定')
  await page.locator('#notes').fill('Synthetic QA uncertainty, not human labels'); await page.locator('#confirm').click()
  await expect(page.locator('#summary')).toContainText('1 / 2')
  const event = page.waitForEvent('download'); await page.locator('#export').click()
  const payload = JSON.parse(fs.readFileSync((await (await event).path())!, 'utf8'))
  expect(payload.complete).toBe(false); expect(payload.qualification).toBe(false)
  expect(payload.entries.find((entry: { id: string }) => entry.id === 'fixture-1')).toMatchObject({ complete: true, uncertain: true, state: 'single' })
  const target = payload.entries[0].targets[0]; expect(target.x).toBeCloseTo(.1, 2); expect(target.width).toBeCloseTo(.2, 2)
  const invalid = { ...payload, reviewer: 'B' }
  await page.locator('#restoreFile').setInputFiles({ name: 'other-reviewer.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) })
  await expect(page.locator('#error')).toContainText('不是本评审')
  await page.locator('#notes').fill('draft to be replaced')
  await page.locator('#restoreFile').setInputFiles({ name: 'own-checkpoint.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) })
  await expect(page.locator('#notes')).toHaveValue('')
  await expect(page.locator('#summary')).toContainText('1 / 2')
  await page.getByRole('radio', { name: '均匀／无明显焦点', exact: true }).check(); await page.locator('#confirm').click()
  await expect(page.locator('#summary')).toContainText('2 / 2')
  expect(errors).toEqual([]); expect(requests.every(url => url === 'https://pilot.test/' || url === 'https://pilot.test/images/fixture.png')).toBe(true)
})

test('reviewers have isolated drafts and no phone overflow in the blind tool', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('https://pilot.test/**', route => route.request().url().includes('/images/')
    ? route.fulfill({ contentType: 'image/png', body: fs.readFileSync('tests/fixtures/palette-test.png') })
    : route.fulfill({ contentType: 'text/html', body: template.replace('/*__PACKET__*/null', JSON.stringify({ ...packet, reviewer: route.request().url().includes('review-b') ? 'B' : 'A' })) }))
  await page.goto('https://pilot.test/')
  await page.getByRole('radio', { name: '分散／纹理', exact: true }).check(); await page.locator('#notes').fill('A only')
  await page.goto('https://pilot.test/review-b')
  await expect(page.locator('#reviewer')).toHaveText('B'); await expect(page.locator('#notes')).toHaveValue('')
  await expect(page.locator('[name=state]:checked')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('portable reviewer page shows embedded images after moving the HTML alone and reloading', async ({ page }) => {
  const requests: string[] = []
  const imageDataUrl = `data:image/png;base64,${fs.readFileSync('tests/fixtures/palette-test.png').toString('base64')}`
  const standalone = { ...packet, reviewer: 'A', entries: packet.entries.map(entry => ({ ...entry, imageDataUrl })) }
  await page.route('https://pilot.test/**', route => {
    requests.push(route.request().url())
    return route.request().url() === 'https://pilot.test/moved/reviewer.html'
      ? route.fulfill({ contentType: 'text/html', body: template.replace('/*__PACKET__*/null', JSON.stringify(standalone)) })
      : route.abort()
  })
  await page.goto('https://pilot.test/moved/reviewer.html')
  await expect(page.locator('#stage')).toHaveAttribute('data-loaded', 'true')
  expect(await page.locator('#photo').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  await page.locator('#jump').selectOption('1'); await expect(page.locator('#stage')).toHaveAttribute('data-loaded', 'true')
  await page.reload(); await expect(page.locator('#stage')).toHaveAttribute('data-loaded', 'true')
  expect(requests.every(url => url === 'https://pilot.test/moved/reviewer.html')).toBe(true)
  await expect(page.locator('#error')).toHaveText('')
})
