import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import type { ReactNode } from 'react'
import Home from '@/app/(site)/page'
import {
  SUPPORT_NOTICE_HEADING,
  SUPPORT_NOTICE_BODY,
} from '@/src/persistence/browser-support'

vi.mock('@/src/store/store', () => ({
  StoreProvider: ({ children }: { children: ReactNode }) => children,
  useStore: vi.fn(),
}))

vi.mock('@/src/store/use-undo-redo', () => ({
  useUndoRedoShortcuts: vi.fn(),
}))

vi.mock('@/src/persistence/browser-support', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/src/persistence/browser-support')>()
  return {
    ...actual,
    supportsFileSystemAccess: vi.fn(),
  }
})

vi.mock('@/src/persistence/use-persistence', () => ({
  usePersistence: vi.fn(),
}))

vi.mock('@/src/persistence/persistence-indicator', () => ({
  PersistenceIndicator: ({ status }: { status: { state: string } }) => (
    <div data-testid="indicator">{status.state}</div>
  ),
}))

import { useStore } from '@/src/store/store'
import { usePersistence } from '@/src/persistence/use-persistence'
import { supportsFileSystemAccess } from '@/src/persistence/browser-support'

const mockedUseStore = vi.mocked(useStore)
const mockedUsePersistence = vi.mocked(usePersistence)
const mockedSupports = vi.mocked(supportsFileSystemAccess)

function baseStore() {
  return {
    state: {
      present: {
        dataset: null,
        fileHandle: null,
        dirty: false,
        importError: false,
      },
      past: [],
      future: [],
      coalesce: { lastType: null, lastKey: null, lastTime: 0 },
    },
    dispatch: vi.fn(),
    canUndo: false,
    canRedo: false,
  }
}

function basePersistence(
  overrides: Partial<ReturnType<typeof usePersistence>> = {},
) {
  return {
    phase: 'ready',
    saveStatus: { state: 'idle' },
    open: vi.fn(),
    saveAsFile: vi.fn(),
    importDroppedFile: vi.fn(),
    retrySave: vi.fn(),
    reconnectHandle: vi.fn(async () => {}),
    ...overrides,
  }
}

beforeEach(() => {
  mockedSupports.mockReturnValue(true)
  mockedUseStore.mockReturnValue(
    baseStore() as unknown as ReturnType<typeof useStore>,
  )
  mockedUsePersistence.mockReturnValue(
    basePersistence() as unknown as ReturnType<typeof usePersistence>,
  )
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Home page: browser gate', () => {
  it('renders the notice and no shell when unsupported', () => {
    mockedSupports.mockReturnValue(false)
    render(<Home />)
    expect(
      screen.getByRole('heading', { level: 1, name: SUPPORT_NOTICE_HEADING }),
    ).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_NOTICE_BODY)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /open file/i }),
    ).not.toBeInTheDocument()
    expect(useStore).not.toHaveBeenCalled()
  })
})

describe('HomeShell: app shell', () => {
  it('renders open / save-as / undo / redo controls when ready', () => {
    mockedUseStore.mockReturnValue({
      ...baseStore(),
      canUndo: true,
      canRedo: true,
    } as unknown as ReturnType<typeof useStore>)
    render(<Home />)
    expect(
      screen.getByRole('button', { name: /open file/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /undo/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /redo/i })).toBeEnabled()
  })

  it('opens a file when the Open file button is clicked', () => {
    const { open } = basePersistence()
    mockedUsePersistence.mockReturnValue(
      basePersistence({ open }) as unknown as ReturnType<typeof usePersistence>,
    )
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: /open file/i }))
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('triggers save-as when the Save as button is clicked', () => {
    const { saveAsFile } = basePersistence()
    mockedUsePersistence.mockReturnValue(
      basePersistence({ saveAsFile }) as unknown as ReturnType<
        typeof usePersistence
      >,
    )
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: /save as/i }))
    expect(saveAsFile).toHaveBeenCalledTimes(1)
  })

  it('dispatches undo and redo from their buttons', () => {
    const dispatch = vi.fn()
    mockedUseStore.mockReturnValue({
      ...baseStore(),
      dispatch,
      canUndo: true,
      canRedo: true,
    } as unknown as ReturnType<typeof useStore>)
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: /undo/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: '__undo' })
    fireEvent.click(screen.getByRole('button', { name: /redo/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: '__redo' })
  })

  it('shows the reconnect affordance when permission is prompt', () => {
    mockedUsePersistence.mockReturnValue(
      basePersistence({ phase: 'reconnect' }) as unknown as ReturnType<
        typeof usePersistence
      >,
    )
    render(<Home />)
    expect(
      screen.getByRole('link', { name: /reconnect file/i }),
    ).toBeInTheDocument()
    // The indicator is not shown in reconnect phase.
    expect(screen.queryByTestId('indicator')).not.toBeInTheDocument()
  })

  it('calls reconnectHandle when the reconnect link is clicked', () => {
    const { reconnectHandle } = basePersistence()
    mockedUsePersistence.mockReturnValue(
      basePersistence({
        phase: 'reconnect',
        reconnectHandle,
      }) as unknown as ReturnType<typeof usePersistence>,
    )
    render(<Home />)
    fireEvent.click(screen.getByRole('link', { name: /reconnect file/i }))
    expect(reconnectHandle).toHaveBeenCalledTimes(1)
  })

  it('renders the persistence indicator in ready phase', () => {
    render(<Home />)
    expect(screen.getByTestId('indicator')).toBeInTheDocument()
  })

  it('renders the drop zone when no dataset is loaded', () => {
    render(<Home />)
    expect(
      screen.getByRole('heading', { name: /drop your lca dataset here/i }),
    ).toBeInTheDocument()
  })

  it('browse triggers open() from the empty drop zone', () => {
    const { open } = basePersistence()
    mockedUsePersistence.mockReturnValue(
      basePersistence({ open }) as unknown as ReturnType<typeof usePersistence>,
    )
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: /browse files/i }))
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('manual-creation link renders in the empty drop zone', () => {
    render(<Home />)
    expect(
      screen.getByRole('link', {
        name: /or start from scratch and create a product manually/i,
      }),
    ).toBeInTheDocument()
  })

  it('does not render the drop zone once a dataset is loaded', () => {
    mockedUseStore.mockReturnValue({
      ...baseStore(),
      state: {
        ...baseStore().state,
        present: { ...baseStore().state.present, dataset: {} },
      },
    } as unknown as ReturnType<typeof useStore>)
    render(<Home />)
    expect(
      screen.queryByRole('heading', { name: /drop your lca dataset here/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'AIOps Sustainability Hackathon' }),
    ).toBeInTheDocument()
  })
})
