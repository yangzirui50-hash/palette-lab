import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

const manifest = process.argv[2]
if (!manifest) throw new Error('Usage: npm run test:corpus -- /absolute/path/to/development/manifest.json')
const child = spawn(process.execPath, ['node_modules/playwright/cli.js', 'test', 'tests/e2e/development-corpus.spec.ts'], {
  stdio: 'inherit', env: { ...process.env, CORPUS_MANIFEST: path.resolve(manifest) },
})
child.on('exit', code => {
  const restored = spawnSync(process.execPath, ['scripts/restore-test-env.mjs'], { stdio: 'inherit' })
  process.exitCode = restored.status === 0 ? (code ?? 1) : 1
})
