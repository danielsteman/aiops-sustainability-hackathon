import { describe, expect, it, vi, afterEach } from 'vitest'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { DropZone } from '@/src/components/ui/drop-zone'

class FakeDataTransfer {
  files: File[] = []
  get items() {
    return {
      add: (file: File) => {
        this.files.push(file)
      },
    }
  }
}

function makeHandlers() {
  return {
    onDropFile: vi.fn(),
    onBrowse: vi.fn(),
    onCreateManual: vi.fn(),
  }
}

function renderZone() {
  const handlers = makeHandlers()
  render(
    <DropZone
      onDropFile={handlers.onDropFile}
      onBrowse={handlers.onBrowse}
      onCreateManual={handlers.onCreateManual}
    />,
  )
  return handlers
}

function dropOn(
  card: HTMLElement,
  dataTransfer: DataTransfer | FakeDataTransfer,
) {
  fireEvent.drop(card, { dataTransfer })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('DropZone', () => {
  it('renders the heading, sub copy, browse button and manual link', () => {
    renderZone()
    expect(
      screen.getByRole('heading', { name: /drop your lca dataset here/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('JSON file with emission factors and products'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /browse files/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: /or start from scratch and create a product manually/i,
      }),
    ).toBeInTheDocument()
  })

  it('calls onBrowse when the Browse files button is clicked', () => {
    const handlers = renderZone()
    fireEvent.click(screen.getByRole('button', { name: /browse files/i }))
    expect(handlers.onBrowse).toHaveBeenCalledTimes(1)
  })

  it('calls onCreateManual when the manual link is clicked', () => {
    const handlers = renderZone()
    fireEvent.click(
      screen.getByRole('link', {
        name: /or start from scratch and create a product manually/i,
      }),
    )
    expect(handlers.onCreateManual).toHaveBeenCalledTimes(1)
  })

  it('forwards a dropped .json file to onDropFile', () => {
    const handlers = renderZone()
    const card = screen.getByTestId('drop-zone-card')
    const dt = new FakeDataTransfer()
    dt.items.add(new File(['{}'], 'dataset.json', { type: 'application/json' }))
    dropOn(card, dt)
    expect(handlers.onDropFile).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByText(/only .json files are supported/i),
    ).not.toBeInTheDocument()
  })

  it('shows an inline error and does not call onDropFile for a .txt file', () => {
    const handlers = renderZone()
    const card = screen.getByTestId('drop-zone-card')
    const dt = new FakeDataTransfer()
    dt.items.add(new File(['nope'], 'notes.txt', { type: 'text/plain' }))
    dropOn(card, dt)
    expect(handlers.onDropFile).not.toHaveBeenCalled()
    expect(
      screen.getByText(/only .json files are supported/i),
    ).toBeInTheDocument()
  })

  it('rejects a non-json drop even when a json is also present only if any non-json present', () => {
    // A mixed drop with a .txt is rejected as a whole; the zone only accepts
    // pure .json drops.
    const handlers = renderZone()
    const card = screen.getByTestId('drop-zone-card')
    const dt = new FakeDataTransfer()
    dt.items.add(new File(['{}'], 'dataset.json', { type: 'application/json' }))
    dt.items.add(new File(['x'], 'readme.txt', { type: 'text/plain' }))
    dropOn(card, dt)
    expect(handlers.onDropFile).not.toHaveBeenCalled()
    expect(
      screen.getByText(/only .json files are supported/i),
    ).toBeInTheDocument()
  })

  it('clears the inline error after a valid .json drop', () => {
    renderZone()
    const card = screen.getByTestId('drop-zone-card')

    const bad = new FakeDataTransfer()
    bad.items.add(new File(['x'], 'notes.txt', { type: 'text/plain' }))
    dropOn(card, bad)
    expect(
      screen.getByText(/only .json files are supported/i),
    ).toBeInTheDocument()

    const good = new FakeDataTransfer()
    good.items.add(new File(['{}'], 'dataset.json', { type: 'application/json' }))
    dropOn(card, good)
    expect(
      screen.queryByText(/only .json files are supported/i),
    ).not.toBeInTheDocument()
  })

  it('restores drag state on drag-leave', () => {
    renderZone()
    const card = screen.getByTestId('drop-zone-card')
    fireEvent.dragEnter(card)
    expect(card.className).toContain('cardDragging')
    fireEvent.dragLeave(card)
    expect(card.className).not.toContain('cardDragging')
  })
})