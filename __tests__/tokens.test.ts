import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tokens } from '@/src/tokens'

const cssPath = join(process.cwd(), 'src', 'tokens.css')

function parseCssVars(css: string): Record<string, string> {
  const vars: Record<string, string> = {}
  const re = /--([\w-]+)\s*:\s*([^;]+);/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css))) {
    vars[m[1] as string] = (m[2] as string).trim()
  }
  return vars
}

describe('design tokens', () => {
  it('tokens.css and tokens.ts are generated from one source', () => {
    const cssVars = parseCssVars(readFileSync(cssPath, 'utf8'))

    for (const [group, values] of Object.entries(tokens)) {
      for (const [name, value] of Object.entries(values)) {
        expect(cssVars[`${group}-${name}`], `${group}-${name}`).toBe(
          String(value),
        )
      }
    }
  })
})