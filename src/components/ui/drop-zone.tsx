'use client'

import { useState, type DragEvent, type MouseEvent } from 'react'
import { Button } from '@/src/components/ui/button'
import styles from './drop-zone.module.css'

export interface DropZoneProps {
  onDropFile: (dataTransfer: DataTransfer) => void
  onBrowse: () => void
  onCreateManual: () => void
}

function isJsonFile(dataTransfer: DataTransfer): boolean {
  const files = Array.from(dataTransfer.files)
  return (
    files.length > 0 &&
    files.every((file) => file.name.toLowerCase().endsWith('.json'))
  )
}

/**
 * Empty-state intake (frame 01): a dashed drop zone for a `.json` LCA dataset
 * with a secondary `Browse files` action, and a manual-creation link below.
 * The drag-over state shifts the border and icon to the primary colour and
 * tints the background; dropping a non-`.json` file shows an inline error
 * without touching the app state.
 */
export function DropZone({
  onDropFile,
  onBrowse,
  onCreateManual,
}: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.length === 0) return
    if (!isJsonFile(event.dataTransfer)) {
      setError('Only .json files are supported.')
      return
    }
    setError(null)
    onDropFile(event.dataTransfer)
  }

  function handleBrowse(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    onBrowse()
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.card} ${dragging ? styles.cardDragging : ''}`}
        data-testid="drop-zone-card"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadIcon dragging={dragging} />
        <h2 className={styles.heading}>Drop your LCA dataset here</h2>
        <p className={styles.sub}>JSON file with emission factors and products</p>
        <div className={styles.browse}>
          <Button variant="secondary" onClick={handleBrowse}>
            Browse files
          </Button>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <a
        className={styles.manualLink}
        href="#"
        onClick={(event) => {
          event.preventDefault()
          onCreateManual()
        }}
      >
        Or start from scratch and create a product manually
      </a>
    </div>
  )
}

function UploadIcon({ dragging }: { dragging: boolean }) {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className={dragging ? styles.iconDragging : undefined}
    >
      <path
        d="M22 30V12m0 0-7 7m7-7 7 7M8 32h28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}