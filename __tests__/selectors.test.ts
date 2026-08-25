import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createSelectors } from '@/src/store/selectors'
import { datasetReducer, type StoreState } from '@/src/store/actions'
import type { Dataset } from '@/src/domain/types'

function loadDataset(): Dataset {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'docs', 'sample-data.json'), 'utf8'),
  ) as Dataset
}

function baseState(): StoreState {
  return {
    dataset: loadDataset(),
    fileHandle: null,
    dirty: false,
    importError: false,
  }
}

describe('selectors', () => {
  it('selectProductImpact returns the identical object reference for unchanged dataset', () => {
    const s = createSelectors(baseState())
    const first = s.selectProductImpact('product_a')
    const second = s.selectProductImpact('product_a')
    expect(first).not.toBeNull()
    expect(second).toBe(first)
  })

  it('editing product B does not invalidate product A memoised impact', () => {
    const state = baseState()
    const s = createSelectors(state)
    const before = s.selectProductImpact('product_a')
    const nextState = datasetReducer(state, {
      type: 'setFlowQuantity',
      payload: {
        productId: 'product_b',
        stageIndex: 0,
        flowIndex: 0,
        value: 99,
      },
    })
    const s2 = createSelectors(nextState)
    const after = s2.selectProductImpact('product_a')
    expect(after).toBe(before)
  })

  it('selectFactorsById returns a factors map', () => {
    const s = createSelectors(baseState())
    const f = s.selectFactorsById()
    expect(f.process_water).toBeDefined()
  })

  it('product A water shares clamp below 3% and widths sum to 100', () => {
    const s = createSelectors(baseState())
    const shares = s.selectStageShares('product_a', 'water')
    const widthSum = shares.reduce((sum, r) => sum + r.width, 0)
    expect(widthSum).toBeGreaterThanOrEqual(99.99)
    expect(widthSum).toBeLessThanOrEqual(100.01)
    const below3 = shares.filter((r) => r.share < 3 && r.share > 0)
    expect(below3.length).toBeGreaterThan(0)
    for (const r of below3) {
      expect(r.width).toBeGreaterThan(r.share)
    }
  })

  it('selectComparison returns three categories on sample data', () => {
    const s = createSelectors(baseState())
    const result = s.selectComparison()
    expect(result).toHaveLength(3)
    expect(result!.map((c) => c.category)).toEqual([
      'gwp',
      'eutrophication',
      'water',
    ])
  })
})
