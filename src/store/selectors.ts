import type { Dataset, EmissionFactor, Product } from '@/src/domain/types'
import {
  productImpact,
  type Factors,
  type ProductImpacts,
} from '@/src/domain/impact'
import { compare, type CategoryComparison } from '@/src/domain/compare'
import type { StoreState } from '@/src/store/actions'
import type { ImpactCategory } from '@/src/domain/format'

export interface StageShareResult {
  stage: string
  share: number
  width: number
}

export interface Selectors {
  selectFactorsById: () => Record<string, EmissionFactor>
  selectProductImpact: (productId: string) => ProductImpacts | null
  selectStageShares: (
    productId: string,
    category: ImpactCategory,
  ) => StageShareResult[]
  selectComparison: () => CategoryComparison[] | null
}

const SHARE_PRECISION = 4
const CLAMP_MIN = 3

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function factors(dataset: Dataset): Factors {
  return Object.fromEntries(
    dataset.emission_factor_database.map((f) => [f.id, f]),
  )
}

/**
 * Stage percentage shares and display widths for one impact category.
 * Widths below 3% — zero included, so a stage with no flows stays visible
 * rather than collapsing — are clamped to 3% and the whole set renormalised to
 * sum to 100. The label always prints the true share; the bar always uses the
 * clamped width.
 */
export function stageShares(
  byStage: Record<string, Record<ImpactCategory, number>>,
  category: ImpactCategory,
): StageShareResult[] {
  const total = Object.values(byStage).reduce(
    (sum, impact) => sum + impact[category],
    0,
  )

  const raw = Object.entries(byStage).map(([stage, impact]) => ({
    stage,
    share: total === 0 ? 0 : (impact[category] / total) * 100,
  }))

  const clamped = raw.map((r) => ({
    ...r,
    width: r.share < CLAMP_MIN ? CLAMP_MIN : r.share,
  }))

  const clampedSum = clamped.reduce((sum, c) => sum + c.width, 0)
  return clamped.map((c) => ({
    stage: c.stage,
    share: roundTo(c.share, SHARE_PRECISION),
    width: clampedSum === 0 ? 0 : roundTo((c.width / clampedSum) * 100, 2),
  }))
}

// Memoisation keyed on object identity. Store updates are immutable, so the
// dataset, its emission_factor_database array, and each product keep stable
// references when an unrelated value changes.
const factorsMemo = new WeakMap<EmissionFactor[], Factors>()

const impactMemo = new WeakMap<
  Product,
  { factors: Factors; value: ProductImpacts }
>()

const sharesMemo = new WeakMap<
  Product,
  Record<ImpactCategory, { factors: Factors; value: StageShareResult[] }>
>()

const comparisonMemo = new WeakMap<
  Dataset,
  { factors: Factors; value: CategoryComparison[] }
>()

function factorsFor(dataset: Dataset): Factors {
  let cached = factorsMemo.get(dataset.emission_factor_database)
  if (!cached) {
    cached = factors(dataset)
    factorsMemo.set(dataset.emission_factor_database, cached)
  }
  return cached
}

export function createSelectors(state: StoreState): Selectors {
  const dataset = state.dataset
  const currentFactors: Factors = dataset ? factorsFor(dataset) : {}

  const findProduct = (id: string): Product | null =>
    dataset?.products.find((p) => p.id === id) ?? null

  return {
    selectFactorsById: () => currentFactors,
    selectProductImpact: (productId) => {
      const product = findProduct(productId)
      if (!product || !dataset) return null
      const cached = impactMemo.get(product)
      if (cached && cached.factors === currentFactors) return cached.value
      const value = productImpact(product, currentFactors)
      impactMemo.set(product, { factors: currentFactors, value })
      return value
    },
    selectStageShares: (productId, category) => {
      const product = findProduct(productId)
      if (!product || !dataset) return []
      const entry =
        sharesMemo.get(product) ??
        ({} as Record<
          ImpactCategory,
          { factors: Factors; value: StageShareResult[] }
        >)
      const cached = entry[category]
      if (cached && cached.factors === currentFactors) return cached.value
      const value = stageShares(
        productImpact(product, currentFactors).byStage,
        category,
      )
      entry[category] = { factors: currentFactors, value }
      sharesMemo.set(product, entry)
      return value
    },
    selectComparison: () => {
      if (!dataset || dataset.products.length < 2) return null
      const a = dataset.products[0]
      const b = dataset.products[1]
      if (!a || !b) return null
      const cached = comparisonMemo.get(dataset)
      if (cached && cached.factors === currentFactors) return cached.value
      const value = compare(a, b, currentFactors)
      comparisonMemo.set(dataset, { factors: currentFactors, value })
      return value
    },
  }
}
