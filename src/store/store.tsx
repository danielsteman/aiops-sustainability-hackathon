import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import {
  historyReducer,
  initialHistory,
  type HistoryAction,
  type HistoryState,
} from '@/src/store/history'

export const initialState: HistoryState['present'] = initialHistory.present

interface StoreContextValue {
  state: HistoryState
  dispatch: Dispatch<HistoryAction>
  canUndo: boolean
  canRedo: boolean
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(historyReducer, initialHistory)
  const value = useMemo(
    () => ({
      state,
      dispatch,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
