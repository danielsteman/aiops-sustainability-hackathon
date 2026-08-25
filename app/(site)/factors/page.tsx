'use client'

import { TopBar } from '@/src/components/layout/top-bar'
import { EmptyState } from '@/src/components/layout/empty-state'
import { NewProductAction } from '@/src/components/layout/new-product-action'
import { useStore } from '@/src/store/store'

export default function FactorsPage() {
  const { state, dispatch, canUndo, canRedo } = useStore()
  const dataset = state.present.dataset

  if (!dataset) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Emission factors" />
        <EmptyState
          heading="No data yet"
          line="Import a dataset or create a product to get started."
          actionLabel="Go to import"
          href="/import"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Emission factors"
        datasetName={dataset.description}
        showUndo
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => dispatch({ type: '__undo' })}
        onRedo={() => dispatch({ type: '__redo' })}
        action={<NewProductAction />}
      />
      <div className="flex flex-col gap-4 p-20">
        {dataset.emission_factor_database.length === 0 ? (
          <EmptyState
            heading="No factors yet"
            line="Add an emission factor to get started."
            actionLabel="New product"
          />
        ) : (
          dataset.emission_factor_database.map((f) => (
            <div
              key={f.id}
              className="rounded border border-stone-200 bg-white p-4"
            >
              {f.name}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
