'use client'

import type { ReactNode } from 'react'
import { StoreProvider, useStore } from '@/src/store/store'
import { useUndoRedoShortcuts } from '@/src/store/use-undo-redo'
import {
  useSupportsFileSystemAccess,
  BrowserSupportNotice,
} from '@/src/persistence/browser-support'
import { usePersistence } from '@/src/persistence/use-persistence'
import { PersistenceProvider } from '@/src/persistence/persistence-context'
import { NewProductModalProvider } from '@/src/components/layout/new-product-modal'
import { Nav } from '@/src/components/layout/nav'
import styles from '@/src/components/layout/shell.module.css'
import {
  ImportIcon,
  ProductsIcon,
  FactorsIcon,
  CompareIcon,
} from '@/src/components/icons'
import type { NavItem } from '@/src/components/layout/nav'

const NAV_ITEMS: NavItem[] = [
  { href: '/import', label: 'Import', icon: <ImportIcon /> },
  { href: '/products', label: 'Products', icon: <ProductsIcon /> },
  { href: '/factors', label: 'Emission factors', icon: <FactorsIcon /> },
  { href: '/compare', label: 'Compare', icon: <CompareIcon /> },
]

/**
 * App shell. If the browser lacks the File System Access API the app is gated
 * behind a full-page notice. Otherwise the persistence controller is created
 * once here and shared with every child route.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  if (!useSupportsFileSystemAccess()) {
    return <BrowserSupportNotice />
  }

  return (
    <StoreProvider>
      <NewProductModalProvider>
        <ShellLayout>{children}</ShellLayout>
      </NewProductModalProvider>
    </StoreProvider>
  )
}

function ShellLayout({ children }: { children: ReactNode }) {
  const { state, dispatch } = useStore()
  useUndoRedoShortcuts(dispatch)
  const { saveStatus, retrySave, open } = usePersistence(state, dispatch)
  const datasetLoaded = state.present.dataset !== null

  return (
    <PersistenceProvider value={{ saveStatus, retrySave, open }}>
      <div className={styles.shell}>
        <Nav
          items={NAV_ITEMS}
          saveStatus={saveStatus}
          onRetry={retrySave}
          datasetLoaded={datasetLoaded}
        />
        <div className={styles.content}>
          <div className={styles.contentInner}>{children}</div>
        </div>
      </div>
    </PersistenceProvider>
  )
}
