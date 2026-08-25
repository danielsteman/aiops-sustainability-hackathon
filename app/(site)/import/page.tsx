'use client'

import { TopBar } from '@/src/components/layout/top-bar'
import { Button } from '@/src/components/ui'
import { useStore } from '@/src/store/store'
import { usePersistenceController } from '@/src/persistence/persistence-context'

export default function ImportPage() {
  const { state } = useStore()
  const { open } = usePersistenceController()
  const datasetName = state.present.dataset?.description

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Import" datasetName={datasetName} />
      <div className="flex flex-col items-center justify-center gap-6 p-20 text-center">
        <p className="max-w-md text-lg leading-8 text-neutral-600">
          Import a dataset file to get started. Products, emission factors and
          the comparison view are built from the imported data.
        </p>
        <Button onClick={() => void open()} type="button">
          {datasetName ? 'Import another file' : 'Choose a file'}
        </Button>
      </div>
    </div>
  )
}
