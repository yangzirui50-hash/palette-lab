import { expect, test } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { performance } from 'node:perf_hooks'

const baseFixtures = [
  ['person-test.png', 'owner-art-person'],
  ['night-city-test.png', 'owner-art-night'],
  ['neon-test.png', 'neon'],
  ['product-reflection-test.png', 'product'],
  ['landscape-test.png', 'landscape'],
  ['ui-test.png', 'ui'],
  ['poster-test.png', 'poster'],
  ['monochrome-test.png', 'monochrome'],
  ['transparent-test.png', 'transparent'],
  ['periodic-test.png', 'periodic'],
  ['tiny-test.png', 'tiny'],
] as const

const generated = JSON.parse(fs.readFileSync('tests/fixtures/benchmark/manifest.json', 'utf8')) as Array<{ file: string; category: string }>
const fixtures = [
  ...baseFixtures.map(([file, category]) => ({ path: path.resolve(`tests/fixtures/${file}`), file, category })),
  ...generated.map((item) => ({ path: path.resolve(`tests/fixtures/benchmark/${item.file}`), file: item.file, category: item.category })),
]

test('benchmarks 50 diverse images with timing and category reporting', async ({ page }) => {
  test.skip(process.env.BENCHMARK !== '1', 'Set BENCHMARK=1 to run the timed 50-image benchmark')
  test.setTimeout(240_000)
  const results: Array<Record<string, unknown>> = []
  const started = performance.now()
  await page.goto('/')

  for (const fixture of fixtures) {
    const itemStarted = performance.now()
    const result: Record<string, unknown> = { file: fixture.file, category: fixture.category }
    try {
      await page.locator('input[type=file]').setInputFiles(fixture.path)
      await expect(page.locator('.spatial-preview img')).toBeVisible({ timeout: 10_000 })
      await expect(page.locator('.spatial-swatches button')).not.toHaveCount(0)
      await expect(page.locator('.spatial-palette-heading')).toContainText('全局色板')
      await expect(page.locator('.spatial-roi')).toHaveCount(0)
      await expect(page.locator('.error-message')).toHaveCount(0)
      const shares = await page.locator('.spatial-swatches button small').allTextContents()
      const total = shares.reduce((sum, value) => sum + Number.parseFloat(value), 0)
      expect(total).toBeGreaterThan(99)
      expect(total).toBeLessThan(101)
      await expect(page.locator('.spatial-facts-core')).not.toContainText('NaN')
      result.paletteCount = shares.length
      result.unassigned = await page.locator('.spatial-unassigned').textContent()
      await page.getByRole('button', { name: '散点分布', exact: true }).click()
      await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /色彩密度热图/)
      await page.getByRole('button', { name: '连续区域', exact: true }).click()
      await expect(page.locator('.spatial-preview img')).toHaveAttribute('alt', /颜色区域高亮/)
      result.status = 'passed'
    } catch (error) {
      result.status = 'failed'
      result.error = error instanceof Error ? error.message.split('\n')[0] : String(error)
    }
    result.ms = Math.round(performance.now() - itemStarted)
    results.push(result)
  }

  const report = {
    date: new Date().toISOString(),
    totalImages: fixtures.length,
    ownerProvidedArtImages: 2,
    syntheticImages: 48,
    totalMs: Math.round(performance.now() - started),
    passed: results.filter((item) => item.status === 'passed').length,
    failed: results.filter((item) => item.status === 'failed').length,
    results,
  }
  fs.writeFileSync('test-results/benchmark-50-report.json', JSON.stringify(report, null, 2))
  expect(report.totalImages).toBe(50)
  expect(report.failed, JSON.stringify(results.filter((item) => item.status === 'failed'), null, 2)).toBe(0)
})
