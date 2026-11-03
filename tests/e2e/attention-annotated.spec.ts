import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { ATTENTION_SCOPE } from '../../src/lib/color/attentionRegions'

type Annotation = { file: string; sha256: string; source: string; license: string; category: string; state: string; targets: Array<{ x: number; y: number; width: number; height: number }> }

test('evaluates frozen focus predictions against independent held-out region annotations', async ({ page }) => {
  const manifestPath = process.env.ATTENTION_MANIFEST
  test.skip(!manifestPath, 'Needs independent human region annotations; unannotated images cannot measure focus accuracy')
  test.skip(ATTENTION_SCOPE === 'contrast-only', 'Contrast-only evidence has no semantic state or priority output; the legacy point/state harness cannot qualify perceived-focus accuracy')
  test.setTimeout(600_000)
  const manifest = JSON.parse(fs.readFileSync(manifestPath!, 'utf8')) as { split: string; annotationMethod: string; annotators: string[]; entries: Annotation[] }
  if (manifest.split !== 'held-out' || manifest.annotationMethod !== 'independent-human-regions' || manifest.annotators.length < 2) throw new Error('Use held-out regions independently reviewed by at least two annotators')
  const entries = manifest.entries
  if (!entries.length || entries.length > 1000) throw new Error('Expected 1–1000 annotated images')
  const root = path.dirname(path.resolve(manifestPath!))
  const results: Array<{ file: string; stateCorrect: boolean; error: number | null; hits: number; targets: number; predicted: number; matchedPredictions: number; centerHit: boolean; negative: boolean }> = []
  await page.route('**/api/**', route => route.abort())
  await page.goto('/')
  for (const entry of entries) {
    if (entry.file !== path.basename(entry.file) || !entry.license || !/^https:\/\//.test(entry.source) || !['uniform', 'distributed', 'single', 'multiple'].includes(entry.state)) throw new Error('Invalid annotation provenance or state')
    const bytes = fs.readFileSync(path.join(root, entry.file))
    if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error('Annotation image hash mismatch')
    for (const target of entry.targets) if (![target.x, target.y, target.width, target.height].every(Number.isFinite) || target.x < 0 || target.y < 0 || target.width <= 0 || target.height <= 0 || target.x + target.width > 1 || target.y + target.height > 1) throw new Error('Invalid normalized target box')
    const negative = ['uniform', 'distributed'].includes(entry.state)
    if ((negative && entry.targets.length) || (!negative && !entry.targets.length)) throw new Error('Focal state and target regions disagree')
    const prediction = await page.evaluate(async ({ bytes, name }) => {
      const { loadRaster } = await import('/src/lib/color/raster.ts')
      const { analyzeAttention } = await import('/src/lib/color/attention.ts')
      const frame = await loadRaster(new File([new Uint8Array(bytes)], name))
      const result = analyzeAttention(frame.pixels, frame.width, frame.height)
      return { state: result.state, foci: result.foci, width: frame.width, height: frame.height }
    }, { bytes: [...bytes], name: entry.file })
    const hits = entry.targets.filter(target => prediction.foci.some(focus => focus.x >= target.x && focus.x <= target.x + target.width && focus.y >= target.y && focus.y <= target.y + target.height)).length
    const matchedPredictions = prediction.foci.filter(focus => entry.targets.some(target => focus.x >= target.x && focus.x <= target.x + target.width && focus.y >= target.y && focus.y <= target.y + target.height)).length
    const centerHit = entry.targets.some(target => .5 >= target.x && .5 <= target.x + target.width && .5 >= target.y && .5 <= target.y + target.height)
    const diagonal = Math.hypot(prediction.width, prediction.height)
    const errors = entry.targets.map(target => prediction.foci.length ? Math.min(...prediction.foci.map(focus => Math.hypot((focus.x - target.x - target.width / 2) * prediction.width, (focus.y - target.y - target.height / 2) * prediction.height) / diagonal)) : 1)
    results.push({ file: entry.file, stateCorrect: prediction.state === entry.state, error: errors.length ? errors.reduce((sum, value) => sum + value, 0) / errors.length : null, hits, targets: entry.targets.length, predicted: prediction.foci.length, matchedPredictions, centerHit, negative })
  }
  const positives = results.filter(result => !result.negative), negatives = results.filter(result => result.negative)
  const errors = positives.map(result => result.error!).sort((a, b) => a - b)
  const quantile = (p: number) => errors.length ? errors[Math.max(0, Math.ceil(p * errors.length) - 1)] : null
  const categories = [...new Set(entries.map(entry => entry.category))]
  const summary = {
    images: results.length, categories: categories.length,
    regionRecall: positives.reduce((sum, result) => sum + result.hits, 0) / Math.max(1, positives.reduce((sum, result) => sum + result.targets, 0)),
    top3HitRate: positives.filter(result => result.hits > 0).length / Math.max(1, positives.length),
    candidatePrecision: positives.reduce((sum, result) => sum + result.matchedPredictions, 0) / Math.max(1, positives.reduce((sum, result) => sum + result.predicted, 0)),
    centerBaselineHitRate: positives.filter(result => result.centerHit).length / Math.max(1, positives.length),
    medianDiagonalError: quantile(.5), p90DiagonalError: quantile(.9),
    falseFocusRate: negatives.filter(result => result.predicted > 0).length / Math.max(1, negatives.length),
    stateAccuracy: results.filter(result => result.stateCorrect).length / results.length,
    qualificationSample: results.length >= 100 && negatives.length >= 20 && categories.length >= 5,
  }
  fs.mkdirSync('test-results', { recursive: true })
  fs.writeFileSync('test-results/attention-annotated-report.json', JSON.stringify({ summary, results }, null, 2))
  // Predeclared initial engineering gates, not claimed eye-tracking accuracy.
  expect(summary.qualificationSample, 'Pilot results are not enough for qualification').toBe(true)
  expect(summary.top3HitRate).toBeGreaterThanOrEqual(.9)
  expect(summary.regionRecall).toBeGreaterThanOrEqual(.8)
  expect(summary.candidatePrecision).toBeGreaterThanOrEqual(.8)
  expect(summary.medianDiagonalError).toBeLessThanOrEqual(.08)
  expect(summary.p90DiagonalError).toBeLessThanOrEqual(.15)
  expect(summary.falseFocusRate).toBeLessThanOrEqual(.05)
  expect(summary.stateAccuracy).toBeGreaterThanOrEqual(.85)
})
