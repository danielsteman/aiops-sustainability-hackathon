import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAutosave, AUTOSAVE_MS } from '@/src/persistence/use-autosave'
import { saveDataset } from '@/src/persistence/fs-access'
import type { StoreState } from '@/src/store/actions'

vi.mock('@/src/persistence/fs-access', () => ({
  saveDataset: vi.fn(),
}))

const mockedSave = vi.mocked(saveDataset)

function makePresent(overrides: Partial<StoreState> = {}): StoreState {
  return {
    dataset: {
      schema_version: '1.0',
      description: 'd',
      emission_factor_database: [],
      products: [],
    },
    fileHandle: {} as FileSystemFileHandle,
    dirty: true,
    importError: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  mockedSave.mockReset()
  mockedSave.mockResolvedValue(undefined)
})

describe('useAutosave', () => {
  it('acceptance: ten rapid edits within the debounce produce exactly one write', async () => {
    const dispatch = vi.fn()
    const { rerender } = renderHook(
      ({ present }) => useAutosave(dispatch, present, true),
      { initialProps: { present: makePresent({ dirty: false }) } },
    )

    // Simulate ten mutations in quick succession, each re-rendering dirty.
    for (let i = 0; i < 10; i++) {
      act(() => {
        rerender({ present: makePresent() })
      })
      act(() => {
        vi.advanceTimersByTime(AUTOSAVE_MS / 10)
      })
    }

    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_MS)
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(mockedSave).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: '__markSaved' })
  })

  it('acceptance: a rejected write surfaces error state and a click retries', async () => {
    const dispatch = vi.fn()
    mockedSave.mockRejectedValueOnce(new Error('disk full'))

    const { result, rerender } = renderHook(
      ({ present }) => useAutosave(dispatch, present, true),
      { initialProps: { present: makePresent() } },
    )

    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_MS)
    })
    await act(async () => {
      await Promise.resolve()
    })

    // After the failed write, the status is error and no __markSaved fired.
    expect(result.current.status).toEqual({ state: 'error' })
    expect(dispatch).not.toHaveBeenCalledWith({ type: '__markSaved' })

    // A retry re-attempts the write. The mock dispatch simulates the store
    // clearing dirty on __markSaved, so the status returns to idle.
    dispatch.mockImplementation((action: { type: string }) => {
      if (action.type === '__markSaved') {
        rerender({ present: makePresent({ dirty: false }) })
      }
    })
    act(() => {
      result.current.retry()
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(mockedSave).toHaveBeenCalledTimes(2)
    expect(result.current.status).toEqual({ state: 'idle' })
    expect(dispatch).toHaveBeenCalledWith({ type: '__markSaved' })
  })

  it('never writes while an import validation error is unresolved', async () => {
    const dispatch = vi.fn()
    renderHook(() =>
      useAutosave(dispatch, makePresent({ importError: true }), true),
    )

    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_MS * 2)
    })
    expect(mockedSave).not.toHaveBeenCalled()
  })

  it('reports dirty when no file handle exists', () => {
    const dispatch = vi.fn()
    const { result } = renderHook(() =>
      useAutosave(dispatch, makePresent({ fileHandle: null }), true),
    )
    expect(result.current.status).toEqual({ state: 'dirty' })
  })
})
