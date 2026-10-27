import fs from 'node:fs'

const path = '.dev.vars'
const backup = '.dev.vars.test-backup'
if (fs.existsSync(path) && !fs.existsSync(backup)) fs.copyFileSync(path, backup)
fs.writeFileSync(path, 'AI_PROVIDER=mock\n')
