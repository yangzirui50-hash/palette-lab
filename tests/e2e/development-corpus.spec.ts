import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

test('runs independent development images through color counts and both spatial views', async ({ page }) => {
  const manifestPath = process.env.CORPUS_MANIFEST
  test.skip(!manifestPath, 'Set CORPUS_MANIFEST to a licensed external development corpus')
  test.setTimeout(600_000)
  const entries = JSON.parse(fs.readFileSync(manifestPath!, 'utf8')) as Array<{ file: string; sha256: string; source: string; license: string; category: string; split: string }>
  if (!entries.length || entries.length > 1000) throw new Error('Expected 1–1000 manifest entries')
  const directory = path.dirname(path.resolve(manifestPath!))
  const results: Array<Record<string, unknown>> = []
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/api/**', route => route.abort())
  await page.goto('/')
  for (const entry of entries) {
    if (entry.file !== path.basename(entry.file) || !/^https:\/\//.test(entry.source) || !entry.license || entry.split !== 'development') throw new Error('Corpus must contain licensed development entries and plain filenames')
    const filename = path.join(directory, entry.file)
    if (createHash('sha256').update(fs.readFileSync(filename)).digest('hex') !== entry.sha256) throw new Error(`Corpus hash changed: ${entry.file}`)
    const record: Record<string, unknown> = { file: entry.file, category: entry.category, counts: [] }
    const started = performance.now()
    let focusSignature = ''
    try {
      await page.locator('.workspace input[type=file]').first().setInputFiles(filename)
      await expect(page.locator('.source-meta strong')).toHaveText(entry.file)
      await expect(page.locator('.spatial-preview img')).toBeVisible()
      for (const count of [4, 6, 8]) {
        const current = Number(await page.locator('.count-control output').textContent())
        for (let step = current; step !== count; step += count > current ? 1 : -1) await page.getByLabel(count > current ? '增加颜色数量' : '减少颜色数量').click()
        await expect(page.locator('.palette-panel')).toHaveAttribute('aria-busy', 'false')
        await expect(page.locator('.spatial-preview img')).toBeVisible()
        await expect(page.locator('.attention-panel summary')).toBeAttached()
        const signature = await page.locator('.attention-panel').evaluate(panel => JSON.stringify({ state: panel.querySelector('.attention-image')?.getAttribute('data-focus-state'), markers: [...panel.querySelectorAll('.attention-marker')].map(marker => marker.getAttribute('style')), regions:[...panel.querySelectorAll('.attention-region')].map(region=>({geometry:region.getAttribute('data-response-geometry'),path:region.getAttribute('d')})) }))
        if (focusSignature) expect(signature).toBe(focusSignature)
        focusSignature = signature
        const colors = await page.locator('.spatial-swatches button').count()
        expect(colors).toBeGreaterThan(0); expect(colors).toBeLessThanOrEqual(count)
        const total = (await page.locator('.spatial-swatches button small').allTextContents()).reduce((sum, text) => sum + Number.parseFloat(text), 0)
        expect(total).toBeGreaterThan(99); expect(total).toBeLessThan(101)
        await expect(page.locator('.spatial-panel')).not.toContainText('NaN')
        await expect(page.locator('.spatial-roi')).toHaveCount(0)
        const unassigned = await page.locator('.spatial-unassigned').textContent()
        await page.getByRole('button', { name: '散点分布', exact: true }).click()
        await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /色彩密度热图/)
        await page.getByRole('button', { name: '连续区域', exact: true }).click()
        await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /颜色区域高亮/)
        ;(record.counts as unknown[]).push({ requested: count, actual: colors, unassigned, focusSignature })
      }
      expect(errors).toEqual([])
      record.status = 'passed'
    } catch (error) {
      record.status = 'failed'
      record.error = error instanceof Error ? error.message : String(error)
    }
    record.ms = Math.round(performance.now() - started)
    results.push(record)
    fs.mkdirSync('test-results', { recursive: true })
    fs.writeFileSync('test-results/development-corpus-report.json', JSON.stringify({ date: new Date().toISOString(), images: results.length, total: entries.length, results, errors }, null, 2))
  }
  expect(results.filter(record => record.status === 'failed')).toEqual([])
})
