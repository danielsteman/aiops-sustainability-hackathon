import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  compare,
  summarise,
  CATEGORY_ORDER,
  type CategoryComparison,
} from '@/src/domain/compare'
import type { Dataset } from '@/src/domain/types'

const dataset = JSON.parse(
  readFileSync(join(process.cwd(), 'docs', 'sample-data.json'), 'utf8'),
) as Dataset

const factors = Object.fromEntries(
  dataset.emission_factor_database.map((f) => [f.id, f]),
)

const productA = dataset.products[0]!
const productB = dataset.products[1]!

const UNITS: Record<string, string> = {
  gwp: 'kg CO₂e',
  eutrophication: 'kg PO₄e',
  water: 'L',
}

function comparison(
  winners: Record<string, 'a' | 'b' | 'tie'>,
  values: Record<string, { a: number; b: number }>,
): CategoryComparison[] {
  return CATEGORY_ORDER.map((category) => {
    const { a, b } = values[category]!
    return {
      category,
      unit: UNITS[category]!,
      a,
      b,
      winner: winners[category]!,
      deltaPercent: 0,
      aBarPercent: 100,
      bBarPercent: 100,
    }
  })
}

describe('compare', () => {
  it('returns one entry per category in fixed order GWP, Eutrophication, Water', () => {
    const result = compare(productA, productB, factors)
    expect(result.map((c) => c.category)).toEqual(CATEGORY_ORDER)
    expect(result.map((c) => c.unit)).toEqual(['kg CO₂e', 'kg PO₄e', 'L'])
  })

  it('produces aWins 1, bWins 2 and names Eutrophication for A on sample data', () => {
    const result = compare(productA, productB, factors)
    const summary = summarise(result)
    expect(summary.aWins).toBe(1)
    expect(summary.bWins).toBe(2)
    expect(summary.sentence).toMatch(
      /Product A performs better on Eutrophication/,
    )
  })

  it('scales bar percents within each category, so the larger value is 100%', () => {
    const result = compare(productA, productB, factors)
    for (const c of result) {
      const max = Math.max(c.a, c.b)
      expect(c.aBarPercent).toBeCloseTo((c.a / max) * 100, 2)
      expect(c.bBarPercent).toBeCloseTo((c.b / max) * 100, 2)
    }
  })

  it('deltaPercent is round(abs(a-b)/max(a,b)*100)', () => {
    const result = compare(productA, productB, factors)
    const gwp = result.find((c) => c.category === 'gwp')!
    expect(gwp.deltaPercent).toBeCloseTo(
      Math.round((Math.abs(gwp.a - gwp.b) / Math.max(gwp.a, gwp.b)) * 100),
      0,
    )
  })

  it('tie fixture yields winner tie and deltaPercent 0', () => {
    const result = compare(productA, structuredClone(productA), factors)
    for (const c of result) {
      expect(c.winner).toBe('tie')
      expect(c.deltaPercent).toBe(0)
    }
  })
})

describe('summarise', () => {
  it('emits the clean-sweep sentence without overall-winner language', () => {
    const wins = { gwp: 'b', eutrophication: 'b', water: 'b' } as const
    const summary = summarise(
      comparison(wins, {
        gwp: { a: 2, b: 1 },
        eutrophication: { a: 2, b: 1 },
        water: { a: 2, b: 1 },
      }),
    )
    expect(summary.sentence).toBe(
      'Product B performs better on all three categories.',
    )
    expect(summary.sentence).not.toMatch(/overall winner/i)
  })

  it('handles a single category winner', () => {
    const wins = { gwp: 'a', eutrophication: 'b', water: 'b' } as const
    const summary = summarise(
      comparison(wins, {
        gwp: { a: 1, b: 2 },
        eutrophication: { a: 2, b: 1 },
        water: { a: 2, b: 1 },
      }),
    )
    expect(summary.aWins).toBe(1)
    expect(summary.bWins).toBe(2)
    expect(summary.sentence).toContain('Product A performs better on GWP')
  })

  it('avoids overall-winner language and is grammatical for 1 vs 2', () => {
    const wins = { gwp: 'a', eutrophication: 'b', water: 'b' } as const
    const summary = summarise(
      comparison(wins, {
        gwp: { a: 1, b: 2 },
        eutrophication: { a: 2, b: 1 },
        water: { a: 2, b: 1 },
      }),
    )
    expect(summary.sentence).toContain('No overall winner')
    expect(summary.sentence).toContain('GWP')
    expect(summary.sentence).toContain('Eutrophication')
    expect(summary.sentence).toContain('Water consumption')
  })
})
