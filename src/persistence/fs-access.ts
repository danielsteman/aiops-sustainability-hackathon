import type { Dataset } from '@/src/domain/types'
import { parse, serialise, slugify } from '@/src/persistence/serialise'

export interface OpenedDataset {
  handle: FileSystemFileHandle
  text: string
}

/**
 * Prompts the user to pick a `.json` file and reads its contents.
 * Restricted to JSON via the `types` filter.
 */
export async function openDataset(): Promise<OpenedDataset> {
  const [handle] = await window.showOpenFilePicker({
    types: [
      {
        description: 'LCA dataset',
        accept: { 'application/json': ['.json'] },
      },
    ],
  })
  const file = await handle.getFile()
  return { handle, text: await file.text() }
}

/**
 * Writes a dataset back to an existing file handle. The stream is truncated
 * first so shrinking datasets do not leave trailing bytes behind.
 */
export async function saveDataset(
  handle: FileSystemFileHandle,
  dataset: Dataset,
): Promise<void> {
  const writable = await handle.createWritable()
  try {
    await writable.truncate(0)
    await writable.write(serialise(dataset))
  } finally {
    await writable.close()
  }
}

/**
 * Lets the user choose a new location and writes the dataset there, returning
 * the new handle so it can be persisted.
 */
export async function saveAs(dataset: Dataset): Promise<FileSystemFileHandle> {
  const handle = await window.showSaveFilePicker({
    suggestedName: slugify(dataset.description),
    types: [
      {
        description: 'LCA dataset',
        accept: { 'application/json': ['.json'] },
      },
    ],
  })
  await saveDataset(handle, dataset)
  return handle
}

export interface SavedHandle {
  handle: FileSystemFileHandle
  text: string
}

/**
 * Restores a persisted handle. Calls `queryPermission`; when the permission is
 * `'prompt'` (not yet granted for this session) it returns a
 * `{ status: 'prompt' }` result instead of auto-requesting — browsers reject
 * permission requests made without a user gesture, so a reconnect affordance
 * must be shown instead.
 */
export async function restoreHandle(
  handle: FileSystemFileHandle,
): Promise<{ status: 'granted'; saved: SavedHandle } | { status: 'prompt' }> {
  const permission = await handle.queryPermission({ mode: 'readwrite' })
  if (permission === 'granted') {
    const file = await handle.getFile()
    return { status: 'granted', saved: { handle, text: await file.text() } }
  }
  return { status: 'prompt' }
}

/**
 * Attempts to regain read-write access to a handle after the user triggers a
 * reconnect. Must be called from a user gesture.
 */
export async function reconnect(
  handle: FileSystemFileHandle,
): Promise<{ status: 'granted'; saved: SavedHandle } | { status: 'prompt' }> {
  const permission = await handle.requestPermission({ mode: 'readwrite' })
  if (permission !== 'granted') return { status: 'prompt' }
  const file = await handle.getFile()
  return { status: 'granted', saved: { handle, text: await file.text() } }
}

export function datasetFromText(text: string): Dataset {
  return parse(text)
}
