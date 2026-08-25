import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { ReactNode } from 'react'
import SiteLayout from '@/app/(site)/layout'
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
    useSupportsFileSystemAccess: vi.fn(),
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

vi.mock('next/navigation', () => ({
  usePathname: () => '/import',
}))

import { useStore } from '@/src/store/store'
import { usePersistence } from '@/src/persistence/use-persistence'
import { useSupportsFileSystemAccess } from '@/src/persistence/browser-support'

const mockedUseStore = vi.mocked(useStore)
const mockedUsePersistence = vi.mocked(usePersistence)
const mockedSupports = vi.mocked(useSupportsFileSystemAccess)

function baseStore(dataset: unknown = null) {
  return {
    state: {
      present: { dataset, fileHandle: null, dirty: false, importError: false },
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

describe('Site layout: browser gate', () => {
  it('renders the notice and no shell when unsupported', () => {
    mockedSupports.mockReturnValue(false)
    render(<SiteLayout>content</SiteLayout>)
    expect(
      screen.getByRole('heading', { level: 1, name: SUPPORT_NOTICE_HEADING }),
    ).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_NOTICE_BODY)).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(useStore).not.toHaveBeenCalled()
  })
})

describe('Site layout: app shell', () => {
  it('renders the nav and the route content when supported', () => {
    render(<SiteLayout>route content</SiteLayout>)
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByText('route content')).toBeInTheDocument()
  })

  it('links to every screen', () => {
    render(<SiteLayout>content</SiteLayout>)
    for (const label of ['Import', 'Products', 'Emission factors', 'Compare']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('marks the current route as the active page', () => {
    render(<SiteLayout>content</SiteLayout>)
    expect(screen.getByRole('link', { name: 'Import' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('shows a no-dataset footer instead of the indicator when nothing is loaded', () => {
    render(<SiteLayout>content</SiteLayout>)
    expect(screen.getByText(/no dataset loaded/i)).toBeInTheDocument()
    expect(screen.queryByTestId('indicator')).not.toBeInTheDocument()
  })

  it('shows the persistence indicator once a dataset is loaded', () => {
    mockedUseStore.mockReturnValue(
      baseStore({ description: 'demo' }) as unknown as ReturnType<
        typeof useStore
      >,
    )
    render(<SiteLayout>content</SiteLayout>)
    expect(screen.getByTestId('indicator')).toBeInTheDocument()
    expect(screen.queryByText(/no dataset loaded/i)).not.toBeInTheDocument()
  })
})
