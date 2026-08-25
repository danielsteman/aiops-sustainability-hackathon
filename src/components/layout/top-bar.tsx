'use client'

import type { ReactNode } from 'react'
import styles from './top-bar.module.css'
import { RedoIcon, UndoIcon } from '@/src/components/icons'

interface TopBarProps {
  title: string
  datasetName?: string
  action?: ReactNode
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  showUndo?: boolean
}

export function TopBar({
  title,
  datasetName,
  action,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  showUndo = false,
}: TopBarProps) {
  const loaded = datasetName !== undefined && datasetName !== ''
  return (
    <header className={styles.topbar}>
      <div className={styles.heading}>
        <h1 className={styles.title}>{title}</h1>
        {loaded && <span className={styles.dataset}>{datasetName}</span>}
      </div>
      <div className={styles.actions}>
        {showUndo && (
          <div className={styles.history}>
            <button
              type="button"
              className={styles.historyButton}
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo ⌘Z"
              aria-label="Undo"
            >
              <UndoIcon />
            </button>
            <button
              type="button"
              className={styles.historyButton}
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
              aria-label="Redo"
            >
              <RedoIcon />
            </button>
          </div>
        )}
        {loaded ? (
          action
        ) : (
          <span className={styles.dataset}>No dataset loaded</span>
        )}
      </div>
    </header>
  )
}
