import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUndoRedoShortcuts } from '@/src/store/use-undo-redo'

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function press(
  handler: ((e: KeyboardEvent) => void) | null,
  init: KeyboardEventInit,
) {
  const event = new KeyboardEvent('keydown', { cancelable: true, ...init })
  act(() => handler?.(event))
  return event
}

describe('useUndoRedoShortcuts', () => {
  it('registers and removes a document keydown listener', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const dispatch = vi.fn()
    const { unmount } = renderHook(() => useUndoRedoShortcuts(dispatch))

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('Cmd+Z dispatches undo and prevents default', () => {
    const dispatch = vi.fn()
    let handler: ((e: KeyboardEvent) => void) | null = null
    vi.spyOn(document, 'addEventListener').mockImplementation((type, fn) => {
      if (type === 'keydown') handler = fn as (e: KeyboardEvent) => void
    })
    renderHook(() => useUndoRedoShortcuts(dispatch))

    const event = press(handler, { key: 'z', metaKey: true })
    expect(dispatch).toHaveBeenCalledWith({ type: '__undo' })
    expect(event.defaultPrevented).toBe(true)
  })

  it('Ctrl+Z dispatches undo', () => {
    const dispatch = vi.fn()
    let handler: ((e: KeyboardEvent) => void) | null = null
    vi.spyOn(document, 'addEventListener').mockImplementation((type, fn) => {
      if (type === 'keydown') handler = fn as (e: KeyboardEvent) => void
    })
    renderHook(() => useUndoRedoShortcuts(dispatch))

    press(handler, { key: 'z', ctrlKey: true })
    expect(dispatch).toHaveBeenCalledWith({ type: '__undo' })
  })

  it('Cmd+Shift+Z dispatches redo', () => {
    const dispatch = vi.fn()
    let handler: ((e: KeyboardEvent) => void) | null = null
    vi.spyOn(document, 'addEventListener').mockImplementation((type, fn) => {
      if (type === 'keydown') handler = fn as (e: KeyboardEvent) => void
    })
    renderHook(() => useUndoRedoShortcuts(dispatch))

    press(handler, { key: 'z', metaKey: true, shiftKey: true })
    expect(dispatch).toHaveBeenCalledWith({ type: '__redo' })
  })

  it('Ctrl+Y dispatches redo', () => {
    const dispatch = vi.fn()
    let handler: ((e: KeyboardEvent) => void) | null = null
    vi.spyOn(document, 'addEventListener').mockImplementation((type, fn) => {
      if (type === 'keydown') handler = fn as (e: KeyboardEvent) => void
    })
    renderHook(() => useUndoRedoShortcuts(dispatch))

    press(handler, { key: 'y', ctrlKey: true })
    expect(dispatch).toHaveBeenCalledWith({ type: '__redo' })
  })

  it('is suppressed when a text input has focus', () => {
    const dispatch = vi.fn()
    let handler: ((e: KeyboardEvent) => void) | null = null
    vi.spyOn(document, 'addEventListener').mockImplementation((type, fn) => {
      if (type === 'keydown') handler = fn as (e: KeyboardEvent) => void
    })
    renderHook(() => useUndoRedoShortcuts(dispatch))

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      cancelable: true,
    })
    Object.defineProperty(event, 'target', { value: input })
    act(() => handler?.(event))

    expect(dispatch).not.toHaveBeenCalled()
    input.remove()
  })

  it('does nothing for a non-modifier key', () => {
    const dispatch = vi.fn()
    let handler: ((e: KeyboardEvent) => void) | null = null
    vi.spyOn(document, 'addEventListener').mockImplementation((type, fn) => {
      if (type === 'keydown') handler = fn as (e: KeyboardEvent) => void
    })
    renderHook(() => useUndoRedoShortcuts(dispatch))

    press(handler, { key: 'a' })
    expect(dispatch).not.toHaveBeenCalled()
  })
})
