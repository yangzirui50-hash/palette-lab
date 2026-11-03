import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { createPilotServer } from './serve-attention-pilot.mjs'
import { boxIoU, matchBoxes, compareReviews } from './lib/attention-pilot.mjs'
// Deliberately synthetic QA records. They never enter the human review packet.
const box = { x: .1, y: .2, width: .2, height: .3 }
const packet = { format: 'palette-lab-attention-pilot', protocol: 'fixture-only', packetId: 'test-only', split: 'development-pilot', qualification: false, entries: Array.from({ length: 30 }, (_, i) => ({ id: `fixture-${i}`, file: `fixture-${i}.png`, sha256: String(i), category: 'synthetic' })) }
const review = reviewer => ({ format: 'palette-lab-attention-review', protocol: packet.protocol, packetId: packet.packetId, split: packet.split, qualification: false, reviewer, method: 'independent-human-regions', complete: false, entries: [{ ...packet.entries[0], state: 'single', targets: [box], uncertain: false, notes: '', complete: true }] })
test('matches corresponding boxes once despite different drawing order', () => {
  const other = { ...box, x: .7 }
  assert.equal(boxIoU(box, box), 1); assert.equal(boxIoU(box, other), 0)
  const pairs = matchBoxes([box, other], [other, box])
  assert.deepEqual(pairs.map(pair => [pair.left, pair.right]), [[0, 1], [1, 0]])
  assert(pairs.every(pair => Math.abs(pair.iou - 1) < 1e-12))
  assert.equal(matchBoxes([box, box], [box]).length, 1)
})
test('keeps missing cases explicit and never promotes pilot to qualification', () => {
  const report = compareReviews(packet, review('A'), review('B'))
  assert.equal(report.summary.compared, 1); assert.equal(report.summary.incomplete, 29)
  assert.equal(report.summary.stateAgreementRate, 1); assert.equal(report.qualification, false)
})
test('flags uncertainty, state, count and overlap disagreements without choosing truth', () => {
  const b = review('B'); b.entries[0] = { ...b.entries[0], state: 'multiple', targets: [{ ...box, x: .7 }, { ...box, y: .6 }], uncertain: true, notes: 'fixture uncertainty' }
  assert.deepEqual(compareReviews(packet, review('A'), b).results[0].reasons, ['state', 'box-count', 'box-overlap', 'uncertain'])
})
test('rejects duplicate reviewers, altered bytes, duplicate rows and false completion', () => {
  assert.throws(() => compareReviews(packet, review('A'), review('A')), /distinct/)
  const b = review('B'); b.entries[0].sha256 = 'tampered'; assert.throws(() => compareReviews(packet, review('A'), b), /checksum/)
  const duplicate = review('B'); duplicate.entries.push(duplicate.entries[0]); assert.throws(() => compareReviews(packet, review('A'), duplicate), /duplicate/)
  const falseComplete = review('B'); falseComplete.complete = true; assert.throws(() => compareReviews(packet, review('A'), falseComplete), /Completion/)
})
test('rejects impossible geometry and mismatched confirmed state, accepts empty partial review', () => {
  const b = review('B'); b.entries[0].targets[0] = { ...box, width: 1 }; assert.throws(() => compareReviews(packet, review('A'), b), /box/)
  const negative = review('B'); negative.entries[0].state = 'uniform'; assert.throws(() => compareReviews(packet, review('A'), negative), /disagree/)
  const empty = review('B'); empty.entries = []; assert.equal(compareReviews(packet, review('A'), empty).summary.compared, 0)
})

test('comparison CLI verifies bytes and renders escaped human notes without generating held-out labels', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'palette-pilot-synthetic-qa-'))
  fs.mkdirSync(path.join(directory, 'images'))
  const bytes = Buffer.from('Synthetic QA image bytes, never a human pilot image')
  const digest = createHash('sha256').update(bytes).digest('hex')
  const fixturePacket = { ...packet, entries: packet.entries.map(entry => ({ ...entry, sha256: digest, source: 'https://example.invalid/fixture', license: 'synthetic-test-only' })) }
  for (const entry of fixturePacket.entries) fs.writeFileSync(path.join(directory, 'images', entry.file), bytes)
  fs.writeFileSync(path.join(directory, 'packet.json'), JSON.stringify(fixturePacket))
  for (const id of ['A', 'B']) {
    const data = review(id); data.entries[0].sha256 = digest; data.entries[0].notes = '<script>fixture-note</script>'
    fs.writeFileSync(path.join(directory, `${id}.json`), JSON.stringify(data))
  }
  const command = () => spawnSync(process.execPath, ['scripts/compare-attention-pilot.mjs', path.join(directory, 'packet.json'), path.join(directory, 'A.json'), path.join(directory, 'B.json')], { encoding: 'utf8' })
  assert.equal(command().status, 0)
  const report = JSON.parse(fs.readFileSync(path.join(directory, '双人试标比较.json'), 'utf8'))
  assert.equal(report.qualification, false); assert.equal(report.summary.compared, 1)
  const html = fs.readFileSync(path.join(directory, '双人试标复核.html'), 'utf8')
  assert(html.includes('&lt;script&gt;fixture-note&lt;/script&gt;')); assert(!html.includes('<script>fixture-note'))
  fs.writeFileSync(path.join(directory, 'images', fixturePacket.entries[0].file), 'tampered')
  assert.notEqual(command().status, 0)
  // Retain this tiny, explicitly synthetic OS-temp evidence; do not touch user files.
})

test('local review server serves only reviewer pages, disallows uploads and file access', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'palette-pilot-server-qa-'))
  fs.writeFileSync(path.join(directory, '评审A.html'), '<!doctype html><title>A fixture</title>')
  fs.writeFileSync(path.join(directory, '评审B.html'), '<!doctype html><title>B fixture</title>')
  const server = createPilotServer(directory)
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  try {
    const url = `http://127.0.0.1:${server.address().port}`
    const response = await fetch(`${url}/review-a`)
    assert.equal(response.status, 200); assert((await response.text()).includes('A fixture'))
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert(response.headers.get('content-security-policy').includes("connect-src 'none'"))
    assert.equal((await fetch(`${url}/review-b`, { method: 'HEAD' })).status, 200)
    assert.equal((await fetch(`${url}/packet.json`)).status, 404)
    assert.equal((await fetch(`${url}/review-a`, { method: 'POST', body: 'must-not-upload' })).status, 404)
  } finally { await new Promise(resolve => server.close(resolve)) }
})
