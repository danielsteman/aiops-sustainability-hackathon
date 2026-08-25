'use client'

import { StoreProvider, useStore } from '@/src/store/store'
import { useUndoRedoShortcuts } from '@/src/store/use-undo-redo'
import {
  supportsFileSystemAccess,
  BrowserSupportNotice,
} from '@/src/persistence/browser-support'
import { usePersistence } from '@/src/persistence/use-persistence'
import { PersistenceIndicator } from '@/src/persistence/persistence-indicator'
import { DropZone } from '@/src/components/ui'

export const dynamic = 'force-static'

/**
 * Full app shell. If the browser lacks the File System Access API the app is
 * gated behind a full-page notice and no store is initialised.
 */
export default function Home() {
  if (!supportsFileSystemAccess()) {
    return <BrowserSupportNotice />
  }

  return (
    <StoreProvider>
      <PersistenceApp />
    </StoreProvider>
  )
}

function PersistenceApp() {
  const { state, dispatch, canUndo, canRedo } = useStore()
  useUndoRedoShortcuts(dispatch)

  const {
    phase,
    saveStatus,
    open,
    saveAsFile,
    importDroppedFile,
    retrySave,
    reconnectHandle,
  } = usePersistence(state, dispatch)

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-black bg-white">
        <nav className="flex h-60 flex-col justify-between p-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void open()}
                className="rounded-md border border-black bg-foreground px-3 py-1.5 text-sm text-background"
              >
                Open file
              </button>
              <button
                type="button"
                onClick={() => void saveAsFile()}
                className="rounded-md border border-black px-3 py-1.5 text-sm"
              >
                Save as…
              </button>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={!canUndo}
                onClick={() => dispatch({ type: '__undo' })}
                className="rounded-md border border-black px-2 py-1 text-xs disabled:opacity-40"
              >
                Undo
              </button>
              <button
                type="button"
                disabled={!canRedo}
                onClick={() => dispatch({ type: '__redo' })}
                className="rounded-md border border-black px-2 py-1 text-xs disabled:opacity-40"
              >
                Redo
              </button>
            </div>
          </div>

          {phase === 'reconnect' ? (
            <ReconnectAffordance onReconnect={reconnectHandle} />
          ) : (
            <PersistenceIndicator status={saveStatus} onRetry={retrySave} />
          )}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {state.present.dataset === null ? (
          <DropZone
            onDropFile={(dataTransfer) => void importDroppedFile(dataTransfer)}
            onBrowse={() => void open()}
            onCreateManual={() => {
              /* LCA-046 opens the New product modal */
            }}
          />
        ) : (
          <>
            <h1 className="text-2xl font-semibold">
              AIOps Sustainability Hackathon
            </h1>
            <p className="mt-2 max-w-xl leading-7 text-zinc-600">
              Open a dataset to start editing. Changes are written straight back
              to your JSON file.
            </p>
          </>
        )}
      </main>
    </div>
  )
}

function ReconnectAffordance({
  onReconnect,
}: {
  onReconnect: () => Promise<void>
}) {
  return (
    <div className="text-sm">
      <DatabaseIcon />
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault()
          void onReconnect()
        }}
      >
        Reconnect file
      </a>
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
