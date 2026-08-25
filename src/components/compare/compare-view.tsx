'use client'

import { useMemo } from 'react'
import type { Product } from '@/src/domain/types'
import { CATEGORY_ORDER, summarise } from '@/src/domain/compare'
import type { ImpactCategory } from '@/src/domain/format'
import { createSelectors } from '@/src/store/selectors'
import { useStore } from '@/src/store/store'
import {
  ProductSummaryCards,
  type ProductCardData,
} from './product-summary-cards'
import { CategoryBlock } from './category-block'
import { TradeOffSummaryPanel } from './trade-off-summary-panel'
import styles from './compare-view.module.css'

const CATEGORY_LABEL: Record<
  ImpactCategory,
  { label: string; description: string }
> = {
  gwp: {
    label: 'GWP',
    description:
      'Global warming potential over 100 years, all greenhouse gases expressed as CO₂ equivalent.',
  },
  eutrophication: {
    label: 'Eutrophication',
    description:
      'Nutrient enrichment of water bodies, expressed as phosphate equivalent.',
  },
  water: {
    label: 'Water',
    description:
      'Freshwater consumed across the life cycle, net of returned water.',
  },
}

function toCardData(product: Product): ProductCardData {
  return {
    id: product.id,
    name: product.name,
    note: product.notes || null,
    functionalUnit: product.functional_unit,
    scalingFactor: product.functional_unit_scaling_factor,
  }
}

/**
 * Comparison view driven by the dataset: two product summary cards, a
 * normalisation strip, then one category block per impact category. All values
 * come from the memoised selectors built on top of `compare()`.
 */
export function CompareView() {
  const { state } = useStore()
  const { dataset } = state.present

  const comparison = useMemo(() => {
    if (!dataset || dataset.products.length < 2) return null
    const selectors = createSelectors(state.present)
    return selectors.selectComparison()
  }, [dataset, state.present])

  if (!dataset || dataset.products.length < 2 || !comparison) return null

  const productA = dataset.products[0]!
  const productB = dataset.products[1]!
  const valid = productA.functional_unit === productB.functional_unit

  return (
    <section className={styles.view} aria-label="Product comparison">
      <ProductSummaryCards
        productA={toCardData(productA)}
        productB={toCardData(productB)}
        functionalUnit={valid ? productA.functional_unit : null}
        valid={valid}
      />

      <div className={styles.blocks} data-disabled={!valid}>
        {CATEGORY_ORDER.map((category) => {
          const meta = CATEGORY_LABEL[category]
          const entry = comparison.find((c) => c.category === category)
          if (!entry) return null
          return (
            <CategoryBlock
              key={category}
              comparison={entry}
              label={meta.label}
              description={meta.description}
            />
          )
        })}
      </div>

      <TradeOffSummaryPanel
        summary={summarise(comparison)}
        comparisons={comparison}
        productAName={productA.name}
        productBName={productB.name}
      />
    </section>
  )
}
