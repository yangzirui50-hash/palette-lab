import { spawn, spawnSync } from 'node:child_process'

const child = spawn(process.execPath, ['node_modules/playwright/cli.js', 'test'], {
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code) => {
  const restored = spawnSync(process.execPath, ['scripts/restore-test-env.mjs'], { stdio: 'inherit' })
  process.exitCode = restored.status === 0 ? (code ?? 1) : 1
})
