import { describe, expect, it } from 'vitest'
import {
  formatImpact,
  formatScalingFactor,
  IMPACT_PRECISION,
  IMPACT_UNITS,
} from '@/src/domain/format'

describe('formatImpact', () => {
  it('normalised eutrophication renders the golden value with fixed decimals', () => {
    expect(formatImpact(0.0000412, 'eutrophication', 'normalised')).toEqual({
      value: '0.000041',
      truncated: true,
    })
  })

  it('never emits an all-zero string for a non-zero value', () => {
    const { value } = formatImpact(0.00000005, 'eutrophication', 'grid')
    expect(value).not.toBe('0.0000000')
    expect(/[1-9]/.test(value)).toBe(true)
  })

  it('returns truncated: false when precision was increased to show a digit', () => {
    expect(formatImpact(0.00000001, 'eutrophication', 'grid')).toEqual({
      value: '0.00000001',
      truncated: false,
    })
  })

  it('emits fixed decimals with en-US grouping, never scientific notation', () => {
    expect(formatImpact(1234567.89, 'gwp', 'grid')).toEqual({
      value: '1,234,567.89',
      truncated: true,
    })
    expect(formatImpact(0.0000412, 'eutrophication', 'grid')).toEqual({
      value: '0.0000412',
      truncated: true,
    })
  })

  it('renders fixed decimals per category and context', () => {
    for (const category of ['gwp', 'eutrophication', 'water'] as const) {
      for (const ctx of ['grid', 'normalised'] as const) {
        const expected = IMPACT_PRECISION[category][ctx]
        const frac = formatImpact(1, category, ctx).value.split(/[.,]/)[1]!
        expect(frac.length).toBe(expected)
      }
    }
  })
})

describe('formatScalingFactor', () => {
  it('formats with two decimals', () => {
    expect(formatScalingFactor(1.333)).toBe('×1.33')
    expect(formatScalingFactor(3.03)).toBe('×3.03')
  })
})

describe('exports', () => {
  it('exports the unit strings', () => {
    expect(IMPACT_UNITS).toEqual({
      gwp: 'kg CO₂e',
      eutrophication: 'kg PO₄e',
      water: 'L',
    })
  })

  it('exports the precision table', () => {
    expect(IMPACT_PRECISION).toEqual({
      gwp: { grid: 2, normalised: 2 },
      eutrophication: { grid: 7, normalised: 6 },
      water: { grid: 1, normalised: 1 },
    })
  })
})
