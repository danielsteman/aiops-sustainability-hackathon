import {
  datasetReducer,
  type StoreAction,
  type StoreState,
} from '@/src/store/actions'

export const HISTORY_LIMIT = 50
export const COALESCE_MS = 500

export type HistoryAction =
  StoreAction | { type: '__undo' } | { type: '__redo' }

export interface HistoryState {
  present: StoreState
  past: StoreState[]
  future: StoreState[]
  coalesce: {
    lastType: string | null
    lastKey: string | null
    lastTime: number
  }
}

export const initialHistory: HistoryState = {
  present: {
    dataset: null,
    fileHandle: null,
    dirty: false,
    importError: false,
  },
  past: [],
  future: [],
  coalesce: { lastType: null, lastKey: null, lastTime: 0 },
}

function emptyCoalesce(): HistoryState['coalesce'] {
  return { lastType: null, lastKey: null, lastTime: 0 }
}

function coalesceKey(action: StoreAction): string | null {
  if (action.type === 'setFlowQuantity') {
    const { productId, stageIndex, flowIndex } = action.payload
    return `setFlowQuantity:${productId}:${stageIndex}:${flowIndex}`
  }
  return null
}

function isCoalescing(
  state: HistoryState,
  action: StoreAction,
  key: string | null,
): boolean {
  if (key === null) return false
  return (
    state.coalesce.lastType === action.type &&
    state.coalesce.lastKey === key &&
    Date.now() - state.coalesce.lastTime <= COALESCE_MS
  )
}

export function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  switch (action.type) {
    case '__undo': {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]!
      return {
        present: previous,
        past: state.past.slice(0, -1),
        future: [state.present, ...state.future],
        coalesce: emptyCoalesce(),
      }
    }

    case '__redo': {
      if (state.future.length === 0) return state
      const next = state.future[0]!
      return {
        present: next,
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        coalesce: emptyCoalesce(),
      }
    }

    default: {
      if (action.type === 'loadDataset') {
        const present = datasetReducer(state.present, action)
        return { present, past: [], future: [], coalesce: emptyCoalesce() }
      }

      // Bookkeeping actions (handle, import status, dirty flag, save) mutate
      // present in place without entering the undo/redo timeline.
      if (
        action.type === 'setFileHandle' ||
        action.type === 'setImportError' ||
        action.type === 'setDirty' ||
        action.type === '__markSaved'
      ) {
        return { ...state, present: datasetReducer(state.present, action) }
      }

      const present = datasetReducer(state.present, action)
      if (present === state.present) return state

      const key = coalesceKey(action)
      const now = Date.now()

      if (isCoalescing(state, action, key)) {
        return {
          present,
          past: state.past,
          future: [],
          coalesce: { lastType: action.type, lastKey: key, lastTime: now },
        }
      }

      return {
        present,
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        future: [],
        coalesce: { lastType: action.type, lastKey: key, lastTime: now },
      }
    }
  }
}
