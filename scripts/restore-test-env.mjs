import fs from 'node:fs'

const path = '.dev.vars'
const backup = '.dev.vars.test-backup'
if (fs.existsSync(backup)) {
  fs.copyFileSync(backup, path)
  fs.rmSync(backup)
} else if (fs.existsSync(path)) {
  fs.rmSync(path)
}
