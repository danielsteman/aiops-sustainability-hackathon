import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tokens } from '../src/tokens.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cssVars = []

for (const [group, values] of Object.entries(tokens)) {
  for (const [name, value] of Object.entries(values)) {
    cssVars.push(`  --${group}-${name}: ${value};`)
  }
}

const css = `:root {\n${cssVars.join('\n')}\n}\n`
const out = join(root, 'src', 'tokens.css')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, css)
