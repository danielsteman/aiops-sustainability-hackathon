import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import {
  datasetReducer,
  type StoreAction,
  type StoreState,
} from '@/src/store/actions'

export const initialState: StoreState = {
  dataset: null,
  fileHandle: null,
  dirty: false,
}

interface StoreContextValue {
  state: StoreState
  dispatch: Dispatch<StoreAction>
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(datasetReducer, initialState)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
