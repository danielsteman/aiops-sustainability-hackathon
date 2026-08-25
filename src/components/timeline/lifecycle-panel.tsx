'use client'

import { useMemo, useState } from 'react'
import type { ImpactCategory } from '@/src/domain/format'
import { CATEGORY_ORDER } from '@/src/domain/compare'
import type { Product } from '@/src/domain/types'
import { createSelectors } from '@/src/store/selectors'
import { useStore } from '@/src/store/store'
import { buildMarkers, buildSegments } from './layout'
import { LifecycleTimeline } from './lifecycle-timeline'
import { FlowList } from './flow-list'
import styles from './timeline.module.css'

/** A selected flow, tied to the product shape it was picked from. */
type Selection = { scope: string; key: string } | null

const CATEGORY_LABEL: Record<ImpactCategory, string> = {
  gwp: 'GWP',
  eutrophication: 'Eutrophication',
  water: 'Water',
}

/**
 * Owns the two pieces of view state the timeline needs: the selected metric,
 * which survives a product switch, and the selected flow, which does not.
 * Neither belongs in the store — they are presentation, not data.
 *
 * The metric resets on a new dataset because the page remounts this panel on
 * import.
 */
export function LifecyclePanel({ product }: { product: Product }) {
  const { state } = useStore()
  const [category, setCategory] = useState<ImpactCategory>('gwp')
  const [selection, setSelection] = useState<Selection>(null)

  const { segments, markers } = useMemo(() => {
    const selectors = createSelectors(state.present)
    const built = buildSegments(
      selectors.selectStageShares(product.id, category),
    )
    return {
      segments: built,
      markers: buildMarkers(
        product,
        selectors.selectFactorsById(),
        category,
        built,
      ),
    }
  }, [state.present, product, category])

  // Selection is positional, so a product switch or any add/remove invalidates
  // it. Storing the scope alongside the key expires stale selections on the
  // render that changes the scope, with no clean-up effect to fall behind.
  const scope = `${product.id}|${product.stages.map((s) => s.flows.length).join(',')}`
  const selectedKey = selection?.scope === scope ? selection.key : null

  const toggle = (key: string) =>
    setSelection((current) =>
      current?.scope === scope && current.key === key ? null : { scope, key },
    )

  return (
    <section className={styles.panel} aria-label="Lifecycle contribution">
      <header className={styles.header}>
        <h2 className={styles.title}>
          Lifecycle contribution · {CATEGORY_LABEL[category]}
        </h2>
        <div
          className={styles.switcher}
          role="group"
          aria-label="Impact category"
        >
          {CATEGORY_ORDER.map((option) => (
            <button
              key={option}
              type="button"
              className={styles.switch}
              data-active={option === category}
              aria-pressed={option === category}
              onClick={() => setCategory(option)}
            >
              {CATEGORY_LABEL[option]}
            </button>
          ))}
        </div>
      </header>

      <LifecycleTimeline
        segments={segments}
        markers={markers}
        category={category}
        selectedKey={selectedKey}
        onSelect={toggle}
      />

      <FlowList
        markers={markers}
        category={category}
        selectedKey={selectedKey}
        onSelect={toggle}
      />
    </section>
  )
}
