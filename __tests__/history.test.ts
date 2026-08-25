import { describe, expect, it, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  historyReducer,
  initialHistory,
  HISTORY_LIMIT,
  COALESCE_MS,
  type HistoryAction,
  type HistoryState,
} from '@/src/store/history'
import type { StoreAction } from '@/src/store/actions'
import type { Dataset } from '@/src/domain/types'

function loadDataset(): Dataset {
  const raw = readFileSync(
    join(process.cwd(), 'docs', 'sample-data.json'),
    'utf8',
  )
  return JSON.parse(raw) as Dataset
}

function baseHistory(dataset: Dataset = loadDataset()): HistoryState {
  return historyReducer(initialHistory, {
    type: 'loadDataset',
    payload: dataset,
  })
}

function run(state: HistoryState, action: HistoryAction): HistoryState {
  return historyReducer(state, action)
}

function quantity(value: number): StoreAction {
  return {
    type: 'setFlowQuantity',
    payload: { productId: 'product_a', stageIndex: 0, flowIndex: 0, value },
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
})

describe('history: bounded undo', () => {
  it('acceptance: 51 edits then 50 undos returns to state after edit 1, 51st undo is a no-op', () => {
    let state = baseHistory()
    for (let i = 1; i <= 51; i++) {
      vi.setSystemTime(i * (COALESCE_MS + 1))
      state = run(state, quantity(i))
    }
    for (let i = 0; i < 50; i++) {
      state = run(state, { type: '__undo' })
    }

    expect(
      state.present.dataset!.products[0]!.stages[0]!.flows[0]!.quantity,
    ).toBe(1)

    const before = state
    state = run(state, { type: '__undo' })
    expect(state).toBe(before)
  })

  it('cap past at HISTORY_LIMIT entries', () => {
    let state = baseHistory()
    for (let i = 1; i <= 60; i++) {
      vi.setSystemTime(i * (COALESCE_MS + 1))
      state = run(state, quantity(i))
    }
    expect(state.past).toHaveLength(HISTORY_LIMIT)
  })
})

describe('historyReducer: coalescing', () => {
  it('consecutive setFlowQuantity on the same flow within 500ms collapse into one entry', () => {
    let state = baseHistory()
    state = run(state, quantity(1))

    vi.setSystemTime(100)
    state = run(state, quantity(2))
    vi.setSystemTime(200)
    state = run(state, quantity(3))

    expect(state.past).toHaveLength(1)
    expect(
      state.present.dataset?.products[0]!.stages[0]!.flows[0]!.quantity,
    ).toBe(3)

    state = run(state, { type: '__undo' })
    expect(
      state.present.dataset?.products[0]!.stages[0]!.flows[0]!.quantity,
    ).toBe(0.25)
    expect(state.future).toHaveLength(1)
  })

  it('coalescing resets when the 500ms window expires', () => {
    let state = baseHistory()
    vi.setSystemTime(0)
    state = run(state, quantity(1))
    vi.setSystemTime(COALESCE_MS + 1)
    state = run(state, quantity(2))

    expect(state.past).toHaveLength(2)
  })

  it('setFlowQuantity on a different flow does not coalesce', () => {
    let state = baseHistory()
    state = run(state, quantity(1))
    state = run(state, {
      type: 'setFlowQuantity',
      payload: {
        productId: 'product_a',
        stageIndex: 0,
        flowIndex: 1,
        value: 9,
      },
    })

    expect(state.past).toHaveLength(2)
  })
})

describe('historyReducer: import clears history', () => {
  it('undo after an import does not restore the pre-import dataset', () => {
    let state = baseHistory()
    state = run(state, quantity(9))

    const imported = loadDataset()
    state = run(state, { type: 'loadDataset', payload: imported })

    expect(state.past).toHaveLength(0)
    expect(state.future).toHaveLength(0)

    state = run(state, { type: '__undo' })
    expect(state.present.dataset).toBe(imported)
    expect(
      state.present.dataset?.products[0]!.stages[0]!.flows[0]!.quantity,
    ).toBe(0.25)
  })
})

describe('historyReducer: bookkeeping actions', () => {
  it('setDirty mutates present in place without entering the timeline', () => {
    let state = baseHistory()
    state = run(state, { type: 'setDirty', payload: true })
    expect(state.present.dirty).toBe(true)
    expect(state.past).toHaveLength(0)

    state = run(state, { type: '__undo' })
    expect(state.present.dirty).toBe(true)
    expect(state.past).toHaveLength(0)
  })
})

describe('historyReducer: redo', () => {
  it('redo returns to the undone state', () => {
    let state = baseHistory()
    state = run(state, quantity(2))

    state = run(state, { type: '__undo' })
    expect(state.future).toHaveLength(1)
    expect(
      state.present.dataset?.products[0]!.stages[0]!.flows[0]!.quantity,
    ).toBe(0.25)

    state = run(state, { type: '__redo' })
    expect(state.future).toHaveLength(0)
    expect(
      state.present.dataset?.products[0]!.stages[0]!.flows[0]!.quantity,
    ).toBe(2)
  })

  it('redo is a no-op when future is empty', () => {
    const state = baseHistory()
    const before = state
    expect(run(state, { type: '__redo' })).toBe(before)
  })
})
