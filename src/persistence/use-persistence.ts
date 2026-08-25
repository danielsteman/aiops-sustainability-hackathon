'use client'

import { useCallback, useEffect, useState, type Dispatch } from 'react'
import type { HistoryAction, HistoryState } from '@/src/store/history'
import {
  openDataset,
  saveAs,
  restoreHandle,
  reconnect,
  datasetFromText,
  extractDroppedFile,
} from '@/src/persistence/fs-access'
import {
  persistHandle,
  readPersistedHandle,
} from '@/src/persistence/handle-store'
import { useAutosave } from '@/src/persistence/use-autosave'
import { validate } from '@/src/domain/validate'

export type PersistencePhase = 'booting' | 'ready' | 'reconnect' | 'unsupported'

export interface UsePersistenceResult {
  phase: PersistencePhase
  saveStatus: ReturnType<typeof useAutosave>['status']
  open: () => Promise<void>
  saveAsFile: () => Promise<void>
  importDroppedFile: (dataTransfer: DataTransfer) => Promise<void>
  retrySave: () => void
  reconnectHandle: () => Promise<void>
}

/**
 * Orchestrates file persistence: picking/importing a dataset, autosaving back
 * to its handle, restoring a persisted handle on reload, and surfacing a
 * reconnect affordance when permission needs a user gesture.
 */
export function usePersistence(
  state: HistoryState,
  dispatch: Dispatch<HistoryAction>,
): UsePersistenceResult {
  const [phase, setPhase] = useState<PersistencePhase>('booting')
  const { present } = state
  const { status: saveStatus, retry } = useAutosave(dispatch, present, true)

  // On mount, restore the last handle. If permission is only 'prompt', show
  // the reconnect affordance instead of auto-requesting.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const handle = await readPersistedHandle()
      if (cancelled) return
      if (!handle) {
        setPhase('ready')
        return
      }
      const result = await restoreHandle(handle)
      if (cancelled) return
      if (result.status === 'granted') {
        dispatch({
          type: 'loadDataset',
          payload: datasetFromText(result.saved.text),
        })
        dispatch({ type: 'setFileHandle', payload: result.saved.handle })
        setPhase('ready')
      } else {
        setPhase('reconnect')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dispatch])

  const open = useCallback(async () => {
    try {
      const { handle, text } = await openDataset()
      const dataset = datasetFromText(text)
      const result = validate(text)
      dispatch({ type: 'loadDataset', payload: dataset })
      dispatch({ type: 'setImportError', payload: !result.ok })
      dispatch({ type: 'setFileHandle', payload: handle })
      await persistHandle(handle)
    } catch {
      // user cancelled or a transient error; leave state untouched
    }
  }, [dispatch])

  const saveAsFile = useCallback(async () => {
    if (!present.dataset) return
    const handle = await saveAs(present.dataset)
    dispatch({ type: 'setFileHandle', payload: handle })
    await persistHandle(handle)
  }, [dispatch, present.dataset])

  /**
   * Imports a dataset dropped onto the drop zone. Reads it through
   * `getAsFileSystemHandle()` when the browser grants a writable handle; a
   * dropped file that yields no handle is imported as dirty so it is never
   * silently treated as read-only.
   */
  const importDroppedFile = useCallback(
    async (dataTransfer: DataTransfer) => {
      try {
        const dropped = await extractDroppedFile(dataTransfer)
        if (!dropped) return
        const dataset = datasetFromText(dropped.text)
        const result = validate(dropped.text)
        dispatch({ type: 'loadDataset', payload: dataset })
        dispatch({ type: 'setImportError', payload: !result.ok })
        if (dropped.status === 'ready') {
          dispatch({ type: 'setFileHandle', payload: dropped.handle })
          await persistHandle(dropped.handle)
        } else {
          dispatch({ type: 'setFileHandle', payload: null })
          dispatch({ type: 'setDirty', payload: true })
        }
      } catch {
        // leave state untouched on transient errors
      }
    },
    [dispatch],
  )

  const onHandleReconnect = useCallback(async () => {
    const handle = await readPersistedHandle()
    if (!handle) {
      setPhase('ready')
      return
    }
    const result = await reconnect(handle)
    if (result.status === 'granted') {
      dispatch({
        type: 'loadDataset',
        payload: datasetFromText(result.saved.text),
      })
      dispatch({ type: 'setFileHandle', payload: result.saved.handle })
      setPhase('ready')
    }
  }, [dispatch])

  // Warn before leaving when there are unsaved changes.
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (present.dirty) event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [present.dirty])

  return {
    phase,
    saveStatus,
    open,
    saveAsFile,
    importDroppedFile,
    retrySave: retry,
    reconnectHandle: onHandleReconnect,
  }
}
