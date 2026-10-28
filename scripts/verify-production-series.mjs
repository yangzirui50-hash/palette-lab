import { chromium } from '@playwright/test'
import path from 'node:path'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const fixture = path.resolve('tests/fixtures/palette-test.png')
const base = 'https://palette-lab.3476554092.workers.dev'

try {
  const response = await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (!response?.ok()) throw new Error(`Production returned ${response?.status() ?? 'no response'}`)
  await page.getByRole('button', { name: '系列', exact: true }).click()
  await page.locator('.series-workspace input[type=file]').setInputFiles([fixture, fixture])
  await page.locator('.series-thumbnail').waitFor({ state: 'visible' })
  const thumbnails = await page.locator('.series-thumbnail').count()
  const sharedColors = await page.locator('.shared-color-grid article').count()
  if (thumbnails !== 2 || sharedColors !== 3) throw new Error('Series extraction mismatch')
  await page.getByRole('button', { name: '统一色组' }).click()
  await page.getByRole('heading', { name: '选择统一策略' }).waitFor({ state: 'visible' })
  const defaultStrategy = await page.getByRole('button', { name: '保留个性', exact: false }).getAttribute('aria-pressed')
  if (defaultStrategy !== 'true') throw new Error('Preserve Accents is not the default')
  const exportButtons = await page.locator('.series-export-actions button').count()
  if (exportButtons !== 4) throw new Error('Series export actions are incomplete')
  console.log(JSON.stringify({ httpStatus: response.status(), thumbnails, sharedColors, defaultStrategy, exportButtons }, null, 2))
} finally {
  await browser.close()
}
