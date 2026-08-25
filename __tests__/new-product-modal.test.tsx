import { describe, expect, it, afterEach } from 'vitest'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import {
  NewProductModalProvider,
  useNewProductModal,
} from '@/src/components/layout/new-product-modal'

function Trigger() {
  const { open } = useNewProductModal()
  return (
    <button type="button" onClick={open}>
      New product
    </button>
  )
}

function openModal() {
  render(
    <NewProductModalProvider>
      <Trigger />
    </NewProductModalProvider>,
  )
  const trigger = screen.getByRole('button', { name: 'New product' })
  trigger.focus()
  fireEvent.click(trigger)
  return { trigger, dialog: screen.getByRole('dialog') }
}

afterEach(cleanup)

describe('New product modal shell', () => {
  it('is closed until the invoking control is used', () => {
    render(
      <NewProductModalProvider>
        <Trigger />
      </NewProductModalProvider>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a labelled modal dialog in a portal on the body', () => {
    const { dialog } = openModal()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('New product')
    expect(dialog.parentElement?.parentElement).toBe(document.body)
  })

  it('moves focus into the modal on open', () => {
    openModal()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('traps Tab and Shift+Tab inside the modal', () => {
    const { dialog } = openModal()
    // fireEvent returns false when the handler called preventDefault, which is
    // how the trap keeps focus from leaving the panel.
    expect(fireEvent.keyDown(dialog, { key: 'Tab' })).toBe(false)
    expect(fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })).toBe(
      false,
    )
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Close' }),
    )
  })

  it('closes on Escape and restores focus to the invoking control', () => {
    const { trigger, dialog } = openModal()
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes on the close button', () => {
    const { trigger } = openModal()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('does not close when the scrim is clicked', () => {
    openModal()
    fireEvent.click(screen.getByTestId('modal-scrim'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('locks background scroll while open and releases it on close', () => {
    const { dialog } = openModal()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(document.body.style.overflow).toBe('')
  })
})
