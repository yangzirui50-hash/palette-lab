import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'

const manifest = JSON.parse(await fs.readFile('docs/fixtures/development-corpus-sources.json', 'utf8'))
const destination = path.resolve(process.argv[2] ?? '.external-corpus')
await fs.mkdir(destination, { recursive: true })
for (const entry of manifest) {
  const url = new URL(entry.url)
  if (entry.file !== path.basename(entry.file) || !['thumb.wikimedia.org', 'upload.wikimedia.org'].includes(url.hostname) || url.protocol !== 'https:' || entry.split !== 'development' || !entry.license || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error('Invalid corpus provenance')
  const filename = path.join(destination, entry.file)
  const hash = bytes => createHash('sha256').update(bytes).digest('hex')
  try {
    const cached = await fs.readFile(filename)
    if (hash(cached) !== entry.sha256) throw new Error(`Existing image hash mismatch: ${entry.file}`)
    continue
  } catch (error) { if (error.code !== 'ENOENT') throw error }
  const response = await fetch(url, { headers: { 'User-Agent': 'PaletteLab-development-corpus/1.0' }, signal: AbortSignal.timeout(60000) })
  if (!response.ok) throw new Error(`Download failed: ${entry.file} HTTP ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > 15 * 1024 * 1024 || hash(bytes) !== entry.sha256) throw new Error(`Source bytes changed: ${entry.file}; review provenance before replacing hashes`)
  await fs.writeFile(filename, bytes, { flag: 'wx' })
  console.log(`Verified ${entry.file}`)
}
await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`Development corpus ready: ${destination}`)
