'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './nav.module.css'
import { PersistenceIndicator } from '@/src/persistence/persistence-indicator'
import type { SaveStatus } from '@/src/persistence/use-autosave'

export interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface NavProps {
  items: NavItem[]
  saveStatus: SaveStatus
  onRetry: () => void
  datasetLoaded: boolean
}

export function Nav({ items, saveStatus, onRetry, datasetLoaded }: NavProps) {
  const pathname = usePathname()
  return (
    <nav className={styles.nav} aria-label="Main">
      <div className={styles.logoSlot}>
        <div
          data-testid="logo-placeholder"
          className={styles.logoPlaceholder}
        />
      </div>
      <ul className={styles.list}>
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.item} ${active ? styles.active : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <footer className={styles.footer}>
        {datasetLoaded ? (
          <PersistenceIndicator status={saveStatus} onRetry={onRetry} />
        ) : (
          <span>No dataset loaded</span>
        )}
      </footer>
    </nav>
  )
}
