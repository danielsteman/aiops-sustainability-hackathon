'use client'

import { TopBar } from '@/src/components/layout/top-bar'
import { EmptyState } from '@/src/components/layout/empty-state'
import { NewProductAction } from '@/src/components/layout/new-product-action'
import { useNewProductModal } from '@/src/components/layout/new-product-modal'
import { useStore } from '@/src/store/store'
import { CompareView } from '@/src/components/compare'

export default function ComparePage() {
  const { state, dispatch, canUndo, canRedo } = useStore()
  const { open } = useNewProductModal()
  const dataset = state.present.dataset

  if (!dataset) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Compare" />
        <EmptyState
          heading="No data yet"
          line="Import a dataset or create a product to get started."
          actionLabel="Go to import"
          href="/import"
        />
      </div>
    )
  }

  const count = dataset.products.length

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Compare"
        datasetName={dataset.description}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => dispatch({ type: '__undo' })}
        onRedo={() => dispatch({ type: '__redo' })}
        action={<NewProductAction />}
      />
      <div className="flex flex-col gap-4 p-20">
        {count < 2 ? (
          <EmptyState
            heading="Compare needs two products"
            line={
              count === 0
                ? 'Import a dataset or create a product to get started.'
                : `There is ${count} product. Add one more to compare.`
            }
            actionLabel="New product"
            onAction={open}
          />
        ) : (
          <CompareView />
        )}
      </div>
    </div>
  )
}
