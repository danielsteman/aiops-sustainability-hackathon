import type { Product } from './types'
import { productImpact, type Factors } from './impact'
import { IMPACT_PRECISION, IMPACT_UNITS, type ImpactCategory } from './format'

export const CATEGORY_ORDER: ImpactCategory[] = [
  'gwp',
  'eutrophication',
  'water',
]

export type Winner = 'a' | 'b' | 'tie'

export interface CategoryComparison {
  category: ImpactCategory
  unit: string
  a: number
  b: number
  winner: Winner
  deltaPercent: number
  aBarPercent: number
  bBarPercent: number
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function compare(
  productA: Product,
  productB: Product,
  factors: Factors,
): CategoryComparison[] {
  const impactA = productImpact(productA, factors).normalised
  const impactB = productImpact(productB, factors).normalised

  return CATEGORY_ORDER.map((category) => {
    const a = impactA[category]
    const b = impactB[category]
    const precision = IMPACT_PRECISION[category].normalised
    const roundedA = round(a, precision)
    const roundedB = round(b, precision)

    const winner: Winner =
      roundedA === roundedB ? 'tie' : roundedA < roundedB ? 'a' : 'b'

    const max = Math.max(a, b)
    const deltaPercent = max === 0 ? 0 : round((Math.abs(a - b) / max) * 100, 0)

    return {
      category,
      unit: IMPACT_UNITS[category],
      a,
      b,
      winner,
      deltaPercent,
      aBarPercent: max === 0 ? 0 : round((a / max) * 100, 2),
      bBarPercent: max === 0 ? 0 : round((b / max) * 100, 2),
    }
  })
}

const CATEGORY_LABEL: Record<ImpactCategory, string> = {
  gwp: 'GWP',
  eutrophication: 'Eutrophication',
  water: 'Water consumption',
}

export interface ComparisonSummary {
  aWins: number
  bWins: number
  sentence: string
}

function names(comparisons: CategoryComparison[], winner: Winner): string[] {
  return comparisons
    .filter((c) => c.winner === winner)
    .map((c) => CATEGORY_LABEL[c.category])
}

function and(list: string[]): string {
  if (list.length === 1) return list[0]!
  return `${list.slice(0, -1).join(' and ')} and ${list[list.length - 1]}`
}

export function summarise(
  comparisons: CategoryComparison[],
): ComparisonSummary {
  const aWins = comparisons.filter((c) => c.winner === 'a').length
  const bWins = comparisons.filter((c) => c.winner === 'b').length

  const aNames = names(comparisons, 'a')
  const bNames = names(comparisons, 'b')

  if (comparisons.length === 3 && aNames.length === 3) {
    return {
      aWins,
      bWins,
      sentence: 'Product A performs better on all three categories.',
    }
  }
  if (comparisons.length === 3 && bNames.length === 3) {
    return {
      aWins,
      bWins,
      sentence: 'Product B performs better on all three categories.',
    }
  }

  const clauses: string[] = []
  if (aNames.length > 0) {
    clauses.push(`Product A performs better on ${and(aNames)}`)
  }
  if (bNames.length > 0) {
    clauses.push(`Product B performs better on ${and(bNames)}`)
  }

  let sentence: string
  if (clauses.length === 0) {
    sentence = 'No winner for any category.'
  } else {
    sentence = clauses.join(', ')
    if (clauses.length === 2 && aNames.length > 0 && bNames.length > 0) {
      sentence = `No overall winner. ${sentence}.`
    }
  }

  return { aWins, bWins, sentence }
}
