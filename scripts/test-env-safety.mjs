import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { prepareTestEnv, restoreTestEnv } from './test-env-utils.mjs'

const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'palette-lab-env-'))
const target = path.join(cwd, '.dev.vars')
try {
  fs.writeFileSync(target, 'AI_PROVIDER=deepseek\nAI_API_KEY=TEST_PLACEHOLDER\n')
  prepareTestEnv(cwd)
  restoreTestEnv(cwd)
  if (!fs.readFileSync(target, 'utf8').includes('AI_PROVIDER=deepseek')) throw new Error('Real configuration was not restored')

  restoreTestEnv(cwd)
  if (!fs.existsSync(target)) throw new Error('Real configuration was deleted without a backup')

  fs.rmSync(target)
  prepareTestEnv(cwd)
  restoreTestEnv(cwd)
  if (fs.existsSync(target)) throw new Error('Mock configuration was not removed')
  console.log('Environment safety tests passed: real config preserved; mock config removed safely.')
} finally {
  fs.rmSync(cwd, { recursive: true, force: true })
}
