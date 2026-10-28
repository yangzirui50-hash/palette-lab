import { spawn } from 'node:child_process'
import fs from 'node:fs'

const envFile = fs.readFileSync('.dev.vars', 'utf8')
const apiKey = envFile.match(/^AI_API_KEY=(.+)$/m)?.[1]?.trim()
if (!apiKey) throw new Error('AI_API_KEY is empty. Configure it locally before verification.')

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '7102'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
})

let serverOutput = ''
server.stdout.on('data', (chunk) => { serverOutput += chunk.toString() })
server.stderr.on('data', (chunk) => { serverOutput += chunk.toString() })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let output = ''

try {
  let ready = false
  for (let attempt = 0; attempt < 45; attempt += 1) {
    try {
      const health = await fetch('http://127.0.0.1:7102/api/health')
      if (health.ok) {
        ready = true
        break
      }
    } catch {
      // Server is still starting.
    }
    await sleep(500)
  }
  if (!ready) throw new Error('Worker did not become ready')

  const image = fs.readFileSync('tests/fixtures/palette-test.png').toString('base64')
  const response = await fetch('http://127.0.0.1:7102/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: `data:image/png;base64,${image}`,
      domain: 'web-ui',
      palette: [
        { hex: '#080808', share: 0.5 },
        { hex: '#e0ff50', share: 0.325 },
        { hex: '#4890e0', share: 0.175 },
      ],
      assignments: { background: '#080808', accent: '#e0ff50', surface: '#4890e0' },
      spatial: [
        { hex: '#080808', pixelCount: 200000, share: 0.5, centroid: { x: 0.25, y: 0.5 }, bounds: { x: 0, y: 0, width: 0.5, height: 1 }, centerShare: 0.5, edgeShare: 0.5, largestComponentShare: 1, componentCount: 1, meanColorSeparation: 0.4 },
        { hex: '#e0ff50', pixelCount: 130000, share: 0.325, centroid: { x: 0.5, y: 0.5 }, bounds: { x: 0.5, y: 0, width: 0.325, height: 1 }, centerShare: 1, edgeShare: 0, largestComponentShare: 1, componentCount: 1, meanColorSeparation: 0.5 },
        { hex: '#4890e0', pixelCount: 70000, share: 0.175, centroid: { x: 0.825, y: 0.5 }, bounds: { x: 0.825, y: 0, width: 0.175, height: 1 }, centerShare: 0, edgeShare: 1, largestComponentShare: 1, componentCount: 1, meanColorSeparation: 0.434 },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  })
  const payload = await response.json()
  console.log(JSON.stringify({
    httpStatus: response.status,
    provider: payload.provider ?? null,
    model: payload.model ?? null,
    summary: payload.summary ?? null,
    error: payload.error ?? payload.message ?? null,
  }, null, 2))
  if (!response.ok) {
    const sanitized = serverOutput.replaceAll(apiKey, '[REDACTED]').replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED]')
    console.error(sanitized.slice(-4000))
    process.exitCode = 1
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Verification failed')
  process.exitCode = 1
} finally {
  server.kill()
}
