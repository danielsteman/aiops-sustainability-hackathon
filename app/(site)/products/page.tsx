'use client'

import { TopBar } from '@/src/components/layout/top-bar'
import { EmptyState } from '@/src/components/layout/empty-state'
import { NewProductAction } from '@/src/components/layout/new-product-action'
import { useStore } from '@/src/store/store'

export default function ProductsPage() {
  const { state, dispatch, canUndo, canRedo } = useStore()
  const dataset = state.present.dataset

  if (!dataset) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Products" />
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
        title="Products"
        datasetName={dataset.description}
        showUndo
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => dispatch({ type: '__undo' })}
        onRedo={() => dispatch({ type: '__redo' })}
        action={<NewProductAction />}
      />
      <div className="flex flex-col gap-4 p-20">
        {dataset.products.length === 0 ? (
          <EmptyState
            heading="No products yet"
            line="Create a product to get started."
            actionLabel="New product"
            onAction={undefined}
          />
        ) : (
          dataset.products.map((p) => (
            <div
              key={p.id}
              className="rounded border border-stone-200 bg-white p-4"
            >
              {p.name}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
