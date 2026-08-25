import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PersistenceIndicator } from '@/src/persistence/persistence-indicator'
import type { SaveStatus } from '@/src/persistence/use-autosave'

function renderAt(status: SaveStatus) {
  const onRetry = vi.fn()
  const view = render(
    <PersistenceIndicator status={status} onRetry={onRetry} />,
  )
  return { onRetry, view }
}

describe('PersistenceIndicator', () => {
  it('shows "All changes saved locally" when idle and clean', () => {
    renderAt({ state: 'idle' })
    expect(screen.getByText('All changes saved locally')).toBeInTheDocument()
  })

  it('shows "Saving…" while saving', () => {
    renderAt({ state: 'saving' })
    expect(screen.getByText('Saving…')).toBeInTheDocument()
  })

  it('shows "Unsaved changes" when dirty with no handle', () => {
    renderAt({ state: 'dirty' })
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })

  it('shows "Save failed — retry" with a clickable retry link on error', () => {
    const { onRetry } = renderAt({ state: 'error' })
    const retryLink = screen.getByRole('link', { name: 'retry' })
    fireEvent.click(retryLink)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
