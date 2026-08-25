import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const componentsDir = join(process.cwd(), 'src', 'components')

function listFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...listFiles(full))
    } else {
      out.push(full)
    }
  }
  return out
}

const HEX_LITERAL = /#[0-9a-fA-F]{3,8}\b/

describe('hex-literal guard', () => {
  it('src/components/** must not contain hex color literals', () => {
    let files: string[] = []
    try {
      statSync(componentsDir)
      files = listFiles(componentsDir)
    } catch {
      files = []
    }

    const offenders = files
      .filter((f) => /\.(ts|tsx|css|js|jsx)$/.test(f))
      .filter((f) => HEX_LITERAL.test(readFileSync(f, 'utf8')))

    expect(offenders, `hex literals found in ${offenders.join(', ')}`).toEqual(
      [],
    )
  })
})
