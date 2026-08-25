'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { UsePersistenceResult } from '@/src/persistence/use-persistence'

export type PersistenceContextValue = Pick<
  UsePersistenceResult,
  'open' | 'saveStatus' | 'retrySave' | 'importDroppedFile'
>

const PersistenceContext = createContext<PersistenceContextValue | undefined>(
  undefined,
)

/**
 * Exposes the persistence controller to any child route. Provided once by the
 * shell layout so the file handle, autosave and reconnect state are shared
 * across /import, /products, /factors and /compare.
 */
export function PersistenceProvider({
  value,
  children,
}: {
  value: PersistenceContextValue
  children: ReactNode
}) {
  return (
    <PersistenceContext.Provider value={value}>
      {children}
    </PersistenceContext.Provider>
  )
}

export function usePersistenceController(): PersistenceContextValue {
  const context = useContext(PersistenceContext)
  if (!context) {
    throw new Error(
      'usePersistenceController must be used within a PersistenceProvider',
    )
  }
  return context
}
