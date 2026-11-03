import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [images, output] = process.argv.slice(2)
if (!images || !output) throw new Error('Usage: node scripts/prepare-attention-pilot.mjs IMAGE_DIRECTORY OUTPUT_DIRECTORY')
const sources = JSON.parse(fs.readFileSync(path.join(root, 'docs/fixtures/development-corpus-sources.json'), 'utf8'))
if (sources.length !== 30) throw new Error('Expected the frozen 30-image development pilot')
// Validate every byte before writing a review packet. Never synthesize annotations.
const entries = sources.map((source, index) => {
  if (source.file !== path.basename(source.file) || source.split !== 'development' || !source.author || !source.license || (!source.licenseUrl && source.license !== 'Public domain') || !/^https:\/\//.test(source.source)) throw new Error('Invalid image provenance')
  const bytes = fs.readFileSync(path.resolve(images, source.file))
  if (createHash('sha256').update(bytes).digest('hex') !== source.sha256) throw new Error(`Image checksum mismatch: ${source.file}`)
  return { id: `P${String(index + 1).padStart(2, '0')}`, ...source, bytes: bytes.length }
})
const protocol = 'focus-pilot-v1'
const packetId = createHash('sha256').update(JSON.stringify({ protocol, images: entries.map(entry => [entry.file, entry.sha256]) })).digest('hex')
const packet = { format: 'palette-lab-attention-pilot', protocol, packetId, split: 'development-pilot', qualification: false, entries }
const out = path.resolve(output)
fs.mkdirSync(path.join(out, 'images'), { recursive: true })
for (const entry of entries) fs.copyFileSync(path.resolve(images, entry.file), path.join(out, 'images', entry.file))
fs.writeFileSync(path.join(out, 'packet.json'), JSON.stringify(packet, null, 2))
const template = fs.readFileSync(path.join(root, 'scripts/templates/attention-pilot.html'), 'utf8')
// The same five starter images support a cheap paired wording review. Orders
// differ, but the first five must overlap before either reviewer labels all 30.
const starters = new Set([0, 5, 10, 15, 20].map(index => entries[index].id))
for (const reviewer of ['A', 'B']) {
  // Distinct deterministic orders reduce discussion/order contamination, not dataset bias.
  const order = [...entries].sort((a, b) => Number(starters.has(b.id)) - Number(starters.has(a.id)) || createHash('sha256').update(reviewer + a.id).digest('hex').localeCompare(createHash('sha256').update(reviewer + b.id).digest('hex')))
  const payload = JSON.stringify({ ...packet, reviewer, entries: order }).replaceAll('<', '\\u003c')
  fs.writeFileSync(path.join(out, `评审${reviewer}.html`), template.replace('/*__PACKET__*/null', payload))
}
fs.copyFileSync(path.join(root, 'docs/ATTENTION_PILOT_GUIDE.txt'), path.join(out, '先读我.txt'))
console.log(JSON.stringify({ packetId, images: entries.length, split: packet.split, qualification: false, output: out }))
