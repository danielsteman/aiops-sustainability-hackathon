import {
  type EmissionFactor,
  type Flow,
  type Product,
  type Stage,
  type StageName,
} from './types'

export interface Impacts {
  gwp: number
  eutrophication: number
  water: number
}

export type Factors = Record<string, EmissionFactor>

export interface ProductImpacts {
  byStage: Record<StageName, Impacts>
  total: Impacts
  normalised: Impacts
}

export class UnknownMaterialError extends Error {
  constructor(
    public readonly materialId: string,
    public readonly flowIndex: number,
  ) {
    super(`Unknown material id "${materialId}" at flow index ${flowIndex}`)
    this.name = 'UnknownMaterialError'
  }
}

const ZERO: Impacts = { gwp: 0, eutrophication: 0, water: 0 }

export function flowImpact(flow: Flow, factor: EmissionFactor): Impacts {
  return {
    gwp: flow.quantity * factor.gwp,
    eutrophication: flow.quantity * factor.eutrophication,
    water: flow.quantity * factor.water,
  }
}

export function stageImpact(stage: Stage, factors: Factors): Impacts {
  const result: Impacts = { ...ZERO }
  stage.flows.forEach((flow, flowIndex) => {
    const factor = factors[flow.material_id]
    if (!factor) {
      throw new UnknownMaterialError(flow.material_id, flowIndex)
    }
    const impact = flowImpact(flow, factor)
    result.gwp += impact.gwp
    result.eutrophication += impact.eutrophication
    result.water += impact.water
  })
  return result
}

export function productImpact(
  product: Product,
  factors: Factors,
): ProductImpacts {
  // Keyed by the product's own stages, in their declared order: a repeated
  // stage name accumulates rather than overwriting.
  const byStage: Record<StageName, Impacts> = {}
  const total: Impacts = { ...ZERO }
  for (const stage of product.stages) {
    const impact = stageImpact(stage, factors)
    const existing = byStage[stage.name]
    byStage[stage.name] = existing
      ? {
          gwp: existing.gwp + impact.gwp,
          eutrophication: existing.eutrophication + impact.eutrophication,
          water: existing.water + impact.water,
        }
      : impact
    total.gwp += impact.gwp
    total.eutrophication += impact.eutrophication
    total.water += impact.water
  }
  const { functional_unit_scaling_factor: scale } = product
  const normalised: Impacts = {
    gwp: total.gwp * scale,
    eutrophication: total.eutrophication * scale,
    water: total.water * scale,
  }
  return { byStage, total, normalised }
}
