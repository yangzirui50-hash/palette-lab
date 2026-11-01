import { chromium, firefox, webkit } from '@playwright/test'
import fs from 'node:fs'

const engines = { chromium, firefox, webkit }
const results = []
for (const [name, type] of Object.entries(engines)) {
  let browser
  try {
    browser = await type.launch({ headless: true })
    const page = await browser.newPage()
    await page.setContent('<title>engine-check</title><p>ok</p>')
    results.push({ engine: name, status: 'available', title: await page.title() })
  } catch (error) {
    results.push({ engine: name, status: 'not-run', reason: error instanceof Error ? error.message.split('\n')[0] : String(error) })
  } finally {
    await browser?.close()
  }
}
fs.writeFileSync('test-results/browser-engines.json', JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
