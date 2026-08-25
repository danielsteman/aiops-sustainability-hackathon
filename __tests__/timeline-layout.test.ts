import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildMarkers,
  buildSegments,
  labelLeftPx,
  LABEL_WIDTH,
  tierGeometry,
  TIERS,
  TIMELINE_HEIGHT,
  LABEL_HEIGHT,
} from '@/src/components/timeline/layout'
import { scrollTop } from '@/src/components/timeline/flow-list'
import { createSelectors } from '@/src/store/selectors'
import type { StoreState } from '@/src/store/actions'
import type { Dataset, Product } from '@/src/domain/types'
import { STAGE_NAMES } from '@/src/domain/types'
import type { Factors } from '@/src/domain/impact'

function loadDataset(): Dataset {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'docs', 'sample-data.json'), 'utf8'),
  ) as Dataset
}

function baseState(dataset: Dataset = loadDataset()): StoreState {
  return { dataset, fileHandle: null, dirty: false, importError: false }
}

function productA(dataset: Dataset): Product {
  return dataset.products.find((p) => p.id === 'product_a')!
}

describe('timeline segments', () => {
  it('renders four segments in canonical order regardless of data order', () => {
    const shares = [
      { stage: 'Transport', share: 25, width: 25 },
      { stage: 'Manufacturing', share: 25, width: 25 },
      { stage: 'Raw material extraction', share: 25, width: 25 },
      { stage: 'Processing', share: 25, width: 25 },
    ]
    const segments = buildSegments(shares)
    expect(segments.map((s) => s.stage)).toEqual([...STAGE_NAMES])
    expect(segments.map((s) => s.left)).toEqual([0, 25, 50, 75])
  })

  it('product A on water clamps every segment to at least 3%', () => {
    const dataset = loadDataset()
    const selectors = createSelectors(baseState(dataset))
    const segments = buildSegments(
      selectors.selectStageShares('product_a', 'water'),
    )
    expect(segments).toHaveLength(4)
    for (const segment of segments) {
      expect(segment.width).toBeGreaterThanOrEqual(2.7)
    }
    const manufacturing = segments.find((s) => s.stage === 'Manufacturing')!
    expect(manufacturing.width).toBeGreaterThan(90)
    // The label prints the unclamped share, not the drawn width.
    expect(manufacturing.share).toBeCloseTo(99.8, 1)
    expect(manufacturing.share).not.toBeCloseTo(manufacturing.width, 1)
  })

  it('a product with no flows at all renders four segments, none collapsed', () => {
    const dataset = loadDataset()
    const empty: Product = {
      ...productA(dataset),
      id: 'empty',
      stages: STAGE_NAMES.map((name) => ({ name, flows: [] })),
    }
    dataset.products.push(empty)
    const selectors = createSelectors(baseState(dataset))
    const segments = buildSegments(selectors.selectStageShares('empty', 'gwp'))
    expect(segments).toHaveLength(4)
    for (const segment of segments) {
      expect(segment.width).toBeGreaterThan(0)
      expect(segment.share.toFixed(1)).toBe('0.0')
    }
  })

  it('a product missing a stage entirely still yields four segments', () => {
    const dataset = loadDataset()
    const partial: Product = {
      ...productA(dataset),
      id: 'partial',
      stages: productA(dataset).stages.slice(0, 2),
    }
    dataset.products.push(partial)
    const selectors = createSelectors(baseState(dataset))
    const segments = buildSegments(
      selectors.selectStageShares('partial', 'gwp'),
    )
    expect(segments.map((s) => s.stage)).toEqual([...STAGE_NAMES])
    for (const segment of segments) {
      expect(segment.width).toBeGreaterThan(0)
    }
  })
})

describe('timeline markers', () => {
  const dataset = loadDataset()
  const selectors = createSelectors(baseState(dataset))
  const product = productA(dataset)
  const factors: Factors = selectors.selectFactorsById()
  const segments = buildSegments(
    selectors.selectStageShares('product_a', 'gwp'),
  )
  const markers = buildMarkers(product, factors, 'gwp', segments)

  it('places one marker per flow, evenly spread inside its segment', () => {
    expect(markers).toHaveLength(13)
    const extraction = segments[0]!
    const first = markers.slice(0, 4)
    first.forEach((marker, i) => {
      expect(marker.left).toBeCloseTo(
        extraction.left + (extraction.width * (i + 1)) / 5,
        6,
      )
    })
    expect(first.every((m) => m.left > 0 && m.left < extraction.width)).toBe(
      true,
    )
  })

  it('cycles tiers by marker index so no two neighbours share a band', () => {
    expect(markers.map((m) => m.tier).slice(0, 6)).toEqual([0, 1, 2, 3, 0, 1])
  })

  it('values are normalised per functional unit', () => {
    const scale = product.functional_unit_scaling_factor
    const flow = product.stages[0]!.flows[0]!
    expect(markers[0]!.value).toBeCloseTo(
      flow.quantity * factors[flow.material_id]!.gwp * scale,
      12,
    )
  })

  it('a flow whose material is missing contributes zero rather than throwing', () => {
    const orphaned: Product = {
      ...product,
      stages: [
        {
          name: 'Processing',
          flows: [{ ...product.stages[0]!.flows[0]!, material_id: 'nope' }],
        },
      ],
    }
    const built = buildMarkers(orphaned, factors, 'gwp', segments)
    expect(built).toHaveLength(1)
    expect(built[0]!.value).toBe(0)
  })
})

describe('label boxes', () => {
  it('every tier label sits inside the container', () => {
    for (let tier = 0; tier < TIERS.length; tier += 1) {
      const { labelTop } = tierGeometry(tier)
      expect(labelTop).toBeGreaterThanOrEqual(0)
      expect(labelTop + LABEL_HEIGHT).toBeLessThanOrEqual(TIMELINE_HEIGHT)
    }
  })

  it('tier bands do not overlap vertically', () => {
    const bands = [0, 1, 2, 3]
      .map((tier) => tierGeometry(tier).labelTop)
      .map((top) => ({ top, bottom: top + LABEL_HEIGHT }))
      .sort((a, b) => a.top - b.top)
    for (let i = 1; i < bands.length; i += 1) {
      expect(bands[i]!.top).toBeGreaterThanOrEqual(bands[i - 1]!.bottom)
    }
  })

  it('labels at the container edges shift inward instead of overflowing', () => {
    const width = 1200
    expect(labelLeftPx(0, width)).toBe(0)
    expect(labelLeftPx(100, width)).toBe(width - LABEL_WIDTH)
    expect(labelLeftPx(50, width)).toBe(width / 2 - LABEL_WIDTH / 2)
  })

  it('no two label boxes overlap for product A on GWP', () => {
    const width = 1200
    const dataset = loadDataset()
    const selectors = createSelectors(baseState(dataset))
    const segments = buildSegments(
      selectors.selectStageShares('product_a', 'gwp'),
    )
    const markers = buildMarkers(
      productA(dataset),
      selectors.selectFactorsById(),
      'gwp',
      segments,
    )
    const boxes = markers.map((marker) => {
      const { labelTop } = tierGeometry(marker.tier)
      const left = labelLeftPx(marker.left, width)
      return {
        left,
        right: left + LABEL_WIDTH,
        top: labelTop,
        bottom: labelTop + LABEL_HEIGHT,
      }
    })

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i]!
        const b = boxes[j]!
        const overlaps =
          a.left < b.right &&
          b.left < a.right &&
          a.top < b.bottom &&
          b.top < a.bottom
        expect(overlaps, `label ${i} overlaps label ${j}`).toBe(false)
      }
    }
  })
})

describe('scrollTop', () => {
  const container = { scrollTop: 100, clientHeight: 200 }

  it('leaves an already visible row alone', () => {
    expect(scrollTop(container, { offsetTop: 150, offsetHeight: 40 })).toBe(100)
  })

  it('scrolls up to a row above the viewport', () => {
    expect(scrollTop(container, { offsetTop: 20, offsetHeight: 40 })).toBe(20)
  })

  it('scrolls down just far enough to reveal a row below the viewport', () => {
    expect(scrollTop(container, { offsetTop: 400, offsetHeight: 40 })).toBe(240)
  })
})
