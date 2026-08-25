'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import styles from './modal.module.css'
import { Button } from '@/src/components/ui'

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
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label="New product"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.heading}>New product</h2>
            <p className={styles.body}>
              The product creation form (LCA-043) will land here.
            </p>
            <div className={styles.actions}>
              <Button onClick={() => setIsOpen(false)} type="button">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </NewProductModalContext.Provider>
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
