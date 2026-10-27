import { spawn } from 'node:child_process'
import fs from 'node:fs'

const envFile = fs.existsSync('.dev.vars') ? fs.readFileSync('.dev.vars', 'utf8') : ''
const readSetting = (name) => envFile.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim() ?? ''
const secrets = ['AI_API_KEY', 'UNSPLASH_ACCESS_KEY'].map(readSetting).filter(Boolean)
const redact = (value) => secrets.reduce(
  (text, secret) => text.replaceAll(secret, '[REDACTED]'),
  value,
).replace(/(?:sk|ds)-[a-zA-Z0-9_-]+/g, '[REDACTED]')

if (!readSetting('AI_API_KEY')) throw new Error('AI_API_KEY is empty. Configure it locally before verification.')
if (!readSetting('UNSPLASH_ACCESS_KEY')) throw new Error('UNSPLASH_ACCESS_KEY is empty. Configure it locally before verification.')

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '7102'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
})
let serverOutput = ''
server.stdout.on('data', (chunk) => { serverOutput += chunk.toString() })
server.stderr.on('data', (chunk) => { serverOutput += chunk.toString() })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
      // The Worker is still starting.
    }
    await sleep(500)
  }
  if (!ready) throw new Error('Worker did not become ready')

  const image = fs.readFileSync('tests/fixtures/palette-test.png').toString('base64')
  const request = {
    image: `data:image/png;base64,${image}`,
    domain: 'web-ui',
    palette: [
      { hex: '#080808', share: 0.5 },
      { hex: '#e0ff50', share: 0.325 },
      { hex: '#4890e0', share: 0.175 },
    ],
    assignments: { background: '#080808', accent: '#e0ff50', surface: '#4890e0' },
    // Mirrors the deterministic mock report; reference comparison still uses the real configured model.
    analysis: {
      summary: '画面以大面积深色作为视觉基底，配合高亮强调色形成明确的视觉重心。',
      subjects: ['几何色块', '高亮主体', '深色背景'],
      scene: '抽象的测试构图，用于验证图像理解与设计分析流程。',
      composition: '左侧深色区域稳定画面，右侧色块形成视觉引导。',
      lighting: '明暗对比明确，亮部具有较强吸引力。',
      styleTags: ['极简', '高对比', '编辑式'],
      suitableUseCases: ['深色工具界面', '作品集首屏'],
      paletteRoles: [
        { role: 'background', rationale: '深色面积最大，适合作为稳定背景而不是行动色。' },
        { role: 'accent', rationale: '高亮黄绿色与背景形成强烈对比，应控制使用面积。' },
      ],
      recommendations: [
        { title: '限制强调色比例', rationale: '高饱和色容易压过信息层级。', action: '仅用于主按钮、焦点和当前状态。' },
      ],
      uncertainties: ['测试图没有真实语义主体，报告不对现实场景做额外推断。'],
      provider: 'mock',
      model: 'deterministic-visual-v1',
    },
  }

  let response
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetch('http://127.0.0.1:7102/api/inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(120_000),
      })
      break
    } catch (error) {
      if (attempt === 1) throw error
      await sleep(2000)
    }
  }
  const payload = await response.json()
  const firstPhoto = payload.photos?.[0]
  console.log(JSON.stringify({
    httpStatus: response.status,
    source: payload.source ?? null,
    query: payload.query ?? null,
    photoCount: Array.isArray(payload.photos) ? payload.photos.length : 0,
    firstPhotographer: firstPhoto?.photographer ?? null,
    hasAttributionLinks: Boolean(firstPhoto?.photographerUrl && firstPhoto?.sourceUrl),
    comparisonProvider: payload.comparison?.provider ?? null,
    comparisonModel: payload.comparison?.model ?? null,
    comparisonSummary: payload.comparison?.summary ?? null,
    comparisonError: payload.comparisonError ?? null,
    error: payload.error ?? payload.message ?? null,
  }, null, 2))

  const valid = response.ok
    && payload.source === 'unsplash'
    && payload.photos?.length > 0
    && firstPhoto?.photographer
    && firstPhoto?.photographerUrl
    && firstPhoto?.sourceUrl
    && payload.comparison?.provider === 'deepseek'
    && payload.comparison?.rankings?.length > 0
  if (!valid) {
    console.error(redact(serverOutput).slice(-4000))
    process.exitCode = 1
  }
} catch (error) {
  console.error(redact(error instanceof Error ? error.message : 'Verification failed'))
  process.exitCode = 1
} finally {
  server.kill()
}
