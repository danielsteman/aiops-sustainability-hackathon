import { useEffect, type Dispatch } from 'react'
import type { HistoryAction } from '@/src/store/history'

function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  )
    return true
  return target.isContentEditable
}

/**
 * Binds Cmd/Ctrl+Z (undo) and Cmd/Ctrl+Shift+Z / Ctrl+Y (redo) at the document
 * level. The shortcuts are suppressed while a text input has focus so the
 * browser's native undo stack applies instead.
 */
export function useUndoRedoShortcuts(dispatch: Dispatch<HistoryAction>): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return
      if (isTextInput(event.target)) return

      const shift = event.shiftKey
      const key = event.key.toLowerCase()

      if (key === 'z' && !shift) {
        event.preventDefault()
        dispatch({ type: '__undo' })
        return
      }

      if ((key === 'z' && shift) || (key === 'y' && !shift)) {
        event.preventDefault()
        dispatch({ type: '__redo' })
        return
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [dispatch])
}
