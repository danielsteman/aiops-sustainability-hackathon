'use client'

import { useState } from 'react'
import { TopBar } from '@/src/components/layout/top-bar'
import { EmptyState } from '@/src/components/layout/empty-state'
import { NewProductAction } from '@/src/components/layout/new-product-action'
import { LifecyclePanel } from '@/src/components/timeline'
import { useStore } from '@/src/store/store'

export default function ProductsPage() {
  const { state, dispatch, canUndo, canRedo } = useStore()
  const dataset = state.present.dataset
  // Stale after an import that drops the product, hence the fallback below.
  const [productId, setProductId] = useState('')

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

  const product =
    dataset.products.find((p) => p.id === productId) ?? dataset.products[0]

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
        {!product ? (
          <EmptyState
            heading="No products yet"
            line="Create a product to get started."
            actionLabel="New product"
            onAction={undefined}
          />
        ) : (
          <>
            {/* Plain select until LCA-024 brings the product tabs. */}
            <label className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Product</span>
              <select
                className="rounded border border-stone-200 bg-white px-2 py-1"
                value={product.id}
                onChange={(e) => setProductId(e.target.value)}
              >
                {dataset.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {/* Remount on a new dataset resets the selected metric. */}
            <LifecyclePanel key={dataset.description} product={product} />
          </>
        )}
      </div>
    </div>
  )
}
