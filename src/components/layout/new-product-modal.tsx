'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import styles from './modal.module.css'

const HEADING_ID = 'new-product-modal-heading'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface NewProductModalContextValue {
  open: () => void
}

const NewProductModalContext = createContext<
  NewProductModalContextValue | undefined
>(undefined)

export function NewProductModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const value = useMemo(() => ({ open: () => setIsOpen(true) }), [])

  return (
    <NewProductModalContext.Provider value={value}>
      {children}
      {isOpen && <NewProductModal onClose={() => setIsOpen(false)} />}
    </NewProductModalContext.Provider>
  )
}

/**
 * Modal shell (frame 02): a centred 720px panel over a 40%-black scrim,
 * rendered in a portal on `document.body`. Focus is trapped inside the panel
 * while it is open and returns to the invoking control on close; Escape
 * closes, but a scrim click does not — the form inside holds unsaved work.
 * Background scrolling is locked for as long as the modal is mounted.
 */
function NewProductModal({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Lock background scroll, move focus into the panel, and hand focus back to
  // whatever opened the modal once it closes.
  useEffect(() => {
    const invoker = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      invoker?.focus()
    }
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) {
        // Nothing focusable inside yet: keep the tab from leaving the panel.
        event.preventDefault()
        return
      }
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  return createPortal(
    <div className={styles.scrim} data-testid="modal-scrim">
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={HEADING_ID}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <h2 id={HEADING_ID} className={styles.heading}>
            New product
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>
        <div className={styles.body}>
          <p className={styles.placeholder}>
            The product form (LCA-044) and the stage builder (LCA-045) land
            here.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function useNewProductModal(): NewProductModalContextValue {
  const context = useContext(NewProductModalContext)
  if (!context) {
    throw new Error(
      'useNewProductModal must be used within a NewProductModalProvider',
    )
  }
  return context
}
