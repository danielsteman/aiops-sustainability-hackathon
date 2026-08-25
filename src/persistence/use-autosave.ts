'use client'

import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react'
import type { HistoryAction } from '@/src/store/history'
import type { StoreState } from '@/src/store/actions'
import { saveDataset } from '@/src/persistence/fs-access'

export const AUTOSAVE_MS = 800

export type SaveStatus =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'dirty' }
  | { state: 'error' }

export interface AutosaveResult {
  status: SaveStatus
  retry: () => void
}

/**
 * Debounced autosave. Fires 800 ms after the last edit that left the store
 * dirty, but only when a file handle exists and no import validation error is
 * unresolved (so a partially-repaired dataset is never written over the file).
 *
 * The idle / saving / dirty states are derived from the store during render;
 * only the async failure flag lives in local state, updated from the write
 * callback. That keeps React's lint rules happy (no ref reads during render,
 * no synchronous setState inside the effect body).
 */
export function useAutosave(
  dispatch: Dispatch<HistoryAction>,
  present: StoreState,
  enabled: boolean,
): AutosaveResult {
  const [saveFailed, setSaveFailed] = useState(false)

  const latestRef = useRef<{ present: StoreState; saveFailed: boolean }>({
    present,
    saveFailed,
  })
  useEffect(() => {
    latestRef.current = { present, saveFailed }
  })

  const retry = useCallback(() => {
    const { present: current, saveFailed: failed } = latestRef.current
    if (!failed) return
    const { fileHandle, dataset, importError } = current
    if (!fileHandle || !dataset || importError) return
    setSaveFailed(false)
    saveDataset(fileHandle, dataset)
      .then(() => {
        dispatch({ type: '__markSaved' })
        setSaveFailed(false)
      })
      .catch(() => setSaveFailed(true))
  }, [dispatch])

  useEffect(() => {
    if (!enabled) return
    const { fileHandle, dirty, dataset, importError } = present
    if (!fileHandle || !dirty || importError) return

    const timeout = setTimeout(() => {
      if (!fileHandle || !dataset) return
      saveDataset(fileHandle, dataset)
        .then(() => {
          dispatch({ type: '__markSaved' })
          setSaveFailed(false)
        })
        .catch(() => setSaveFailed(true))
    }, AUTOSAVE_MS)
    return () => clearTimeout(timeout)
  }, [enabled, present, dispatch])

  let status: SaveStatus
  if (!present.dirty) status = { state: 'idle' }
  else if (saveFailed) status = { state: 'error' }
  else if (!present.fileHandle || present.importError)
    status = { state: 'dirty' }
  else status = { state: 'saving' }

  return { status, retry }
}
