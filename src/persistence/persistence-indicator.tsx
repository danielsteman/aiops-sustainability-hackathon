import type { SaveStatus } from '@/src/persistence/use-autosave'

export interface PersistenceIndicatorProps {
  status: SaveStatus
  onRetry: () => void
}

function copyFor(status: SaveStatus): string {
  switch (status.state) {
    case 'idle':
      return 'All changes saved locally'
    case 'saving':
      return 'Saving…'
    case 'dirty':
      return 'Unsaved changes'
    case 'error':
      return 'Save failed — retry'
  }
}

/**
 * Nav footer indicator with four states, all 14px neutral gray with a leading
 * database icon. The error state uses `--colors-error` for the text only.
 */
export function PersistenceIndicator({
  status,
  onRetry,
}: PersistenceIndicatorProps) {
  const copy = copyFor(status)
  const isError = status.state === 'error'
  const text = (
    <span
      className="text-sm"
      style={{ color: isError ? 'var(--colors-error)' : undefined }}
    >
      {isError ? (
        <>
          Save failed —{' '}
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault()
              onRetry()
            }}
          >
            retry
          </a>
        </>
      ) : (
        copy
      )}
    </span>
  )

  return (
    <div className="flex items-center gap-1.5 text-sm text-neutral-400">
      <DatabaseIcon />
      {text}
    </div>
  )
}

function DatabaseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  )
}
