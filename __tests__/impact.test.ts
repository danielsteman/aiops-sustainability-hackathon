import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  flowImpact,
  productImpact,
  stageImpact,
  UnknownMaterialError,
} from '@/src/domain/impact'
import type { Dataset, EmissionFactor } from '@/src/domain/types'

const dataset = JSON.parse(
  readFileSync(join(process.cwd(), 'docs', 'sample-data.json'), 'utf8'),
) as Dataset

const factors = Object.fromEntries(
  dataset.emission_factor_database.map((f) => [f.id, f]),
)

const productA = dataset.products[0]!
const productB = dataset.products[1]!

const close = (actual: number, expected: number, digits = 9) =>
  expect(actual).toBeCloseTo(expected, digits)

function expectImpacts(
  impacts: {
    gwp: number
    eutrophication: number
    water: number
  },
  expected: { gwp: number; eutrophication: number; water: number },
) {
  close(impacts.gwp, expected.gwp)
  close(impacts.eutrophication, expected.eutrophication)
  close(impacts.water, expected.water)
}

describe('impact calculation', () => {
  it('flowImpact multiplies quantity by each category factor', () => {
    const factor: EmissionFactor = {
      ...dataset.emission_factor_database[0]!,
      gwp: 2.73,
      eutrophication: 0.0025,
      water: 0.12,
    }
    const flow = productA.stages[0]!.flows[0]!
    expectImpacts(flowImpact({ ...flow, quantity: 0.022 }, factor), {
      gwp: 0.06006,
      eutrophication: 0.000055,
      water: 0.00264,
    })
  })

  it('stageImpact sums over flows', () => {
    expectImpacts(stageImpact(productA.stages[0]!, factors), {
      gwp: 0.0186,
      eutrophication: 0.00000385,
      water: 0.00185,
    })
  })

  it('Product A stage subtotals match golden values', () => {
    const { byStage } = productImpact(productA, factors)
    const gwp = Object.values(byStage).map((i) => i.gwp)
    gwp.forEach((v, idx) => close(v, [0.0186, 0.1372, 0.02316, 0.033312][idx]!))
  })

  it('productImpact returns byStage, total, and normalised', () => {
    const { byStage, total, normalised } = productImpact(productA, factors)
    expectImpacts(byStage['Raw material extraction'], {
      gwp: 0.0186,
      eutrophication: 0.00000385,
      water: 0.00185,
    })
    expectImpacts(total, {
      gwp: 0.212272,
      eutrophication: 0.00003092,
      water: 1.803957,
    })
    const scale = productA.functional_unit_scaling_factor
    expectImpacts(normalised, {
      gwp: total.gwp * scale,
      eutrophication: total.eutrophication * scale,
      water: total.water * scale,
    })
  })

  it('throws UnknownMaterialError for unknown material id', () => {
    productA.stages[0]!.flows[0]!.material_id = 'nope_123'
    let caught: unknown
    try {
      productImpact(productA, factors)
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(UnknownMaterialError)
    expect((caught as UnknownMaterialError).materialId).toBe('nope_123')
  })

  it('is invariant to emission_factor_database order', () => {
    const shuffled = structuredClone(dataset)
    shuffled.emission_factor_database.reverse()
    const shuffledFactors = Object.fromEntries(
      shuffled.emission_factor_database.map((f) => [f.id, f]),
    )
    const a = productImpact(productB, factors)
    const b = productImpact(productB, shuffledFactors)
    expect(b).toEqual(a)
  })
})
