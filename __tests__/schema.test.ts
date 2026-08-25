import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseDataset } from '@/src/domain/schema'

describe('dataset schema', () => {
  it('parses docs/sample-data.json clean', () => {
    const raw = readFileSync(
      join(process.cwd(), 'docs', 'sample-data.json'),
      'utf8',
    )
    const result = parseDataset(JSON.parse(raw))
    expect(result.success).toBe(true)
  })

  it('reports dot/bracket path when flows is an object', () => {
    const base = JSON.parse(
      readFileSync(join(process.cwd(), 'docs', 'sample-data.json'), 'utf8'),
    )
    base.products[1].stages[2].flows = { material_id: 'x' }

    const result = parseDataset(base)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        'products[1].stages[2].flows',
      )
    }
  })

  it('reports emission_factor_database[n].water for "12" with expected number', () => {
    const base = JSON.parse(
      readFileSync(join(process.cwd(), 'docs', 'sample-data.json'), 'utf8'),
    )
    base.emission_factor_database[0].water = '12'

    const result = parseDataset(base)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        'emission_factor_database[0].water',
      )
      expect(result.error.issues[0]?.message).toContain('expected number')
    }
  })
})
