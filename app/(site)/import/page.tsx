'use client'

import { TopBar } from '@/src/components/layout/top-bar'
import { Button, DropZone } from '@/src/components/ui'
import { useNewProductModal } from '@/src/components/layout/new-product-modal'
import { useStore } from '@/src/store/store'
import { usePersistenceController } from '@/src/persistence/persistence-context'

export default function ImportPage() {
  const { state } = useStore()
  const { open, importDroppedFile } = usePersistenceController()
  const { open: openNewProduct } = useNewProductModal()
  const datasetName = state.present.dataset?.description

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Import" datasetName={datasetName} />
      {datasetName ? (
        <div className="flex flex-col items-center justify-center gap-6 p-20 text-center">
          <p className="max-w-md text-lg leading-8 text-neutral-600">
            Products, emission factors and the comparison view are built from
            the imported data.
          </p>
          <Button onClick={() => void open()} type="button">
            Import another file
          </Button>
        </div>
      ) : (
        <DropZone
          onDropFile={(dataTransfer) => void importDroppedFile(dataTransfer)}
          onBrowse={() => void open()}
          onCreateManual={openNewProduct}
        />
      )}
    </div>
  )
}
