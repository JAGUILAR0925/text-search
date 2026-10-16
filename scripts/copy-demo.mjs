// Copies the compiled library next to the demo page so docs/ is self-contained.
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'

rmSync('docs/lib', { recursive: true, force: true })
mkdirSync('docs/lib', { recursive: true })
for (const file of readdirSync('dist').filter(f => f.endsWith('.js')))
  cpSync(`dist/${file}`, `docs/lib/${file}`)
console.log('docs/lib updated')
