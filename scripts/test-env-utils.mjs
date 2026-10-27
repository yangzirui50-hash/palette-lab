import fs from 'node:fs'
import path from 'node:path'

const marker = '# PALETTE_LAB_TEST_ENV=1'

export function prepareTestEnv(cwd = process.cwd()) {
  const target = path.join(cwd, '.dev.vars')
  const backup = path.join(cwd, '.dev.vars.test-backup')
  if (fs.existsSync(target) && !fs.existsSync(backup)) fs.copyFileSync(target, backup)
  fs.writeFileSync(target, `${marker}\nAI_PROVIDER=mock\nUNSPLASH_PROVIDER=mock\nUNSPLASH_ACCESS_KEY=\n`)
}

export function restoreTestEnv(cwd = process.cwd()) {
  const target = path.join(cwd, '.dev.vars')
  const backup = path.join(cwd, '.dev.vars.test-backup')
  if (fs.existsSync(backup)) {
    fs.copyFileSync(backup, target)
    fs.rmSync(backup)
    return
  }
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf8').includes(marker)) fs.rmSync(target)
}
