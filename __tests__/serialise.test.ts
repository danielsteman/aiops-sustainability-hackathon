import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serialise, parse, slugify } from '@/src/persistence/serialise'
import type { Dataset } from '@/src/domain/types'

function loadRaw(): string {
  return readFileSync(join(process.cwd(), 'docs', 'sample-data.json'), 'utf8')
}

function keyOrder(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return []
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    keys.push(`${prefix}${key}`)
    if (Array.isArray(value)) {
      value.forEach((item, i) =>
        keys.push(...keyOrder(item, `${prefix}${key}[${i}].`)),
      )
    } else if (typeof value === 'object' && value !== null) {
      keys.push(...keyOrder(value, `${prefix}${key}.`))
    }
  }
  return keys
}

describe('dataset serialisation', () => {
  it('round-trips the sample dataset: parse(serialise(d)) deep-equals d', () => {
    const raw = loadRaw()
    const original = JSON.parse(raw) as Dataset
    const out = parse(serialise(original))
    expect(out).toEqual(original)
  })

  it('preserves key order as parsed from the sample file', () => {
    const raw = loadRaw()
    const original = JSON.parse(raw) as Dataset
    const sourceOrder = keyOrder(JSON.parse(raw))
    const roundTripped = keyOrder(parse(serialise(original)))
    expect(roundTripped).toEqual(sourceOrder)
  })

  it('uses a 2-space indent and a trailing newline', () => {
    const raw = loadRaw()
    const original = JSON.parse(raw) as Dataset
    const out = serialise(original)
    expect(out.endsWith('\n')).toBe(true)
    expect(out).toContain('\n  "schema_version"')
  })

  it('is idempotent: re-serialising a parsed output is byte-identical', () => {
    const raw = loadRaw()
    const once = serialise(JSON.parse(raw) as Dataset)
    const twice = serialise(parse(once))
    expect(twice).toBe(once)
  })

  it('slugify derives a slugified .json file name from the description', () => {
    expect(slugify('Still mineral water, 750 ml glass bottle')).toBe(
      'still-mineral-water-750-ml-glass-bottle.json',
    )
    expect(slugify('')).toBe('dataset.json')
  })
})
