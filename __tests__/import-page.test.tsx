import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import ImportPage from '@/app/(site)/import/page'

vi.mock('@/src/store/store', () => ({ useStore: vi.fn() }))
vi.mock('@/src/persistence/persistence-context', () => ({
  usePersistenceController: vi.fn(),
}))
vi.mock('@/src/components/layout/new-product-modal', () => ({
  useNewProductModal: vi.fn(),
}))

import { useStore } from '@/src/store/store'
import { usePersistenceController } from '@/src/persistence/persistence-context'
import { useNewProductModal } from '@/src/components/layout/new-product-modal'

const mockedUseStore = vi.mocked(useStore)
const mockedController = vi.mocked(usePersistenceController)
const mockedModal = vi.mocked(useNewProductModal)

const open = vi.fn()
const importDroppedFile = vi.fn()
const openNewProduct = vi.fn()

function withDataset(dataset: unknown) {
  mockedUseStore.mockReturnValue({
    state: { present: { dataset } },
  } as unknown as ReturnType<typeof useStore>)
}

beforeEach(() => {
  withDataset(null)
  mockedController.mockReturnValue({
    open,
    importDroppedFile,
    saveStatus: { state: 'idle' },
    retrySave: vi.fn(),
  } as unknown as ReturnType<typeof usePersistenceController>)
  mockedModal.mockReturnValue({ open: openNewProduct })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Import page: empty state', () => {
  it('renders the drop zone when no dataset is loaded', () => {
    render(<ImportPage />)
    expect(
      screen.getByRole('heading', { name: /drop your lca dataset here/i }),
    ).toBeInTheDocument()
  })

  it('browse triggers open()', () => {
    render(<ImportPage />)
    fireEvent.click(screen.getByRole('button', { name: /browse files/i }))
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('the manual-creation link opens the new product modal', () => {
    render(<ImportPage />)
    fireEvent.click(
      screen.getByRole('link', {
        name: /or start from scratch and create a product manually/i,
      }),
    )
    expect(openNewProduct).toHaveBeenCalledTimes(1)
  })

  it('imports a dropped .json file', () => {
    render(<ImportPage />)
    const file = new File(['{}'], 'dataset.json', { type: 'application/json' })
    const dataTransfer = { files: [file], items: [], types: ['Files'] }
    fireEvent.drop(screen.getByTestId('drop-zone-card'), { dataTransfer })
    expect(importDroppedFile).toHaveBeenCalledTimes(1)
  })
})

describe('Import page: dataset loaded', () => {
  it('offers a re-import instead of the drop zone', () => {
    withDataset({ description: 'demo dataset' })
    render(<ImportPage />)
    expect(
      screen.queryByRole('heading', { name: /drop your lca dataset here/i }),
    ).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: /import another file/i }),
    )
    expect(open).toHaveBeenCalledTimes(1)
  })
})
