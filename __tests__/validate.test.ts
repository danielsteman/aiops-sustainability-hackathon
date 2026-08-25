import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validate } from '@/src/domain/validate'

const sample = (): string =>
  readFileSync(join(process.cwd(), 'docs', 'sample-data.json'), 'utf8')

type MutableDoc = {
  products: {
    stages: {
      flows: Array<Record<string, unknown>>
    }[]
  }[]
  [key: string]: unknown
}

function withMutation(fn: (doc: MutableDoc) => void): string {
  const doc = JSON.parse(sample()) as MutableDoc
  fn(doc)
  return JSON.stringify(doc, null, 2)
}

function firstFlow(doc: MutableDoc): Record<string, unknown> {
  return doc.products[0]!.stages[0]!.flows[0]!
}

describe('validate', () => {
  it('accepts docs/sample-data.json with matching counts', () => {
    const result = validate(sample())
    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
    expect(result.counts).toEqual({
      factors: 13,
      regionalVariantGroups: 1,
      products: 2,
      stages: 8,
      flows: 23,
    })
  })

  it('reports a malformed issue with line number when flows is an object', () => {
    const json = withMutation((doc) => {
      doc.products[1]!.stages[2]!.flows = { material_id: 'x' } as never
    })
    const result = validate(json)
    expect(result.ok).toBe(false)
    const issue = result.issues.find((i) => i.kind === 'malformed')
    expect(issue?.path).toBe('products[1].stages[2].flows')
    expect(typeof issue?.line).toBe('number')
  })

  it('reports unknown-material with no suggestion for alu_1_GLo_v2', () => {
    const json = withMutation((doc) => {
      firstFlow(doc).material_id = 'alu_1_GLo_v2'
    })
    const result = validate(json)
    expect(result.ok).toBe(false)
    const issue = result.issues.find((i) => i.kind === 'unknown-material')
    expect(issue?.message).toContain('alu_1_GLo_v2')
    expect(issue?.suggestedMaterialId).toBeUndefined()
  })

  it('proposes a regional sibling for electricity_grid_XX', () => {
    const json = withMutation((doc) => {
      firstFlow(doc).material_id = 'electricity_grid_XX'
    })
    const result = validate(json)
    const issue = result.issues.find((i) => i.kind === 'unknown-material')
    expect(issue?.suggestedMaterialId).toBe('electricity_grid_NL')
  })

  it('reports unit-mismatch for kg flow against a kWh factor', () => {
    const json = withMutation((doc) => {
      firstFlow(doc).material_id = 'electricity_grid_NL'
      firstFlow(doc).unit = 'kg'
    })
    const result = validate(json)
    expect(result.ok).toBe(false)
    const issue = result.issues.find((i) => i.kind === 'unit-mismatch')
    expect(issue).toBeDefined()
    expect(issue?.flowRef).toBeDefined()
  })

  it('reports malformed for invalid JSON', () => {
    const result = validate('{ not json')
    expect(result.ok).toBe(false)
    const issue = result.issues[0]
    expect(issue?.kind).toBe('malformed')
    expect(issue?.path).toBe('')
  })
})
