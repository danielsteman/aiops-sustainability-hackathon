import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { useEffect, type Dispatch } from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LifecyclePanel } from '@/src/components/timeline'
import { StoreProvider, useStore } from '@/src/store/store'
import type { HistoryAction } from '@/src/store/history'
import type { Dataset } from '@/src/domain/types'

function loadDataset(): Dataset {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'docs', 'sample-data.json'), 'utf8'),
  ) as Dataset
}

let dispatch: Dispatch<HistoryAction>

/**
 * Loads the sample dataset into a real store and renders the panel for the
 * chosen product, so the tests exercise the same selector path as the app.
 */
function Harness({ productIndex }: { productIndex: number }) {
  const { state, dispatch: storeDispatch } = useStore()

  useEffect(() => {
    dispatch = storeDispatch
    storeDispatch({ type: 'loadDataset', payload: loadDataset() })
  }, [storeDispatch])

  const product = state.present.dataset?.products[productIndex]
  return product ? <LifecyclePanel product={product} /> : null
}

function tree(productIndex: number) {
  return (
    <StoreProvider>
      <Harness productIndex={productIndex} />
    </StoreProvider>
  )
}

function renderPanel(productIndex = 0) {
  return render(tree(productIndex))
}

function metric(name: string) {
  return within(
    screen.getByRole('group', { name: 'Impact category' }),
  ).getByRole('button', { name })
}

function markers() {
  return within(screen.getByRole('group', { name: /timeline/i })).getAllByRole(
    'button',
  )
}

/** Flow selections only — the metric switcher also uses `aria-pressed`. */
function pressed() {
  const switcher = screen.getByRole('group', { name: 'Impact category' })
  return screen
    .getAllByRole('button')
    .filter((b) => b.getAttribute('aria-pressed') === 'true')
    .filter((b) => !switcher.contains(b))
}

afterEach(cleanup)

describe('metric switcher', () => {
  it('offers all three metrics with GWP selected first', () => {
    renderPanel()
    expect(metric('GWP')).toHaveAttribute('aria-pressed', 'true')
    expect(metric('Eutrophication')).toHaveAttribute('aria-pressed', 'false')
    expect(metric('Water')).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.getByRole('heading', { name: /Lifecycle contribution · GWP/ }),
    ).toBeInTheDocument()
  })

  it('switching metric relabels the heading and recomputes marker values', () => {
    renderPanel()
    const before = markers()[0]!.parentElement!.textContent
    fireEvent.click(metric('Water'))
    expect(
      screen.getByRole('heading', { name: /Lifecycle contribution · Water/ }),
    ).toBeInTheDocument()
    expect(markers()[0]!.parentElement!.textContent).not.toBe(before)
  })

  it('keeps the chosen metric when the product changes', () => {
    const { rerender } = renderPanel(0)
    fireEvent.click(metric('Water'))
    rerender(tree(1))
    expect(metric('Water')).toHaveAttribute('aria-pressed', 'true')
    expect(markers()).toHaveLength(10)
  })
})

describe('markers', () => {
  it('renders one marker per flow, each exposing its full description', () => {
    renderPanel()
    const dots = markers()
    expect(dots).toHaveLength(13)
    const long = loadDataset().products[0]!.stages[0]!.flows[0]!.description
    expect(long.length).toBeGreaterThan(40)
    expect(dots[0]).toHaveAttribute('title', long)
    expect(dots[0]!.parentElement!.textContent).toContain(long)
  })

  it('drives the axis and every marker from inline geometry', () => {
    renderPanel()
    const segments = screen
      .getByRole('group', { name: /timeline/i })
      .querySelectorAll('[data-stage]')
    expect(segments).toHaveLength(4)
    const widths = [...segments].map((s) =>
      parseFloat((s as HTMLElement).style.width),
    )
    expect(widths.every((w) => w > 0)).toBe(true)
    expect(widths.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 1)

    for (const dot of markers()) {
      const wrapper = dot.parentElement as HTMLElement
      expect(wrapper.style.getPropertyValue('--marker-left')).toMatch(/%$/)
      expect(parseFloat((dot as HTMLElement).style.top)).toBe(133)
    }
  })

  it('appends the category unit to the marker value', () => {
    renderPanel()
    expect(markers()[0]!.parentElement!.textContent).toContain('kg CO₂e')
    fireEvent.click(metric('Water'))
    expect(markers()[0]!.parentElement!.textContent).toContain(' L')
  })
})

describe('marker ↔ row selection', () => {
  // jsdom ships no scrollIntoView, so it has to be installed to be observed at
  // all — its absence afterwards is the proof that nothing reached for it.
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    scrollIntoView.mockClear()
    Element.prototype.scrollIntoView = scrollIntoView
  })

  afterEach(() => {
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView
  })

  it('selecting a marker selects its row and nothing else', () => {
    renderPanel()
    fireEvent.click(markers()[2]!)
    expect(pressed()).toHaveLength(2)
  })

  it('clicking the selected marker again deselects', () => {
    renderPanel()
    fireEvent.click(markers()[2]!)
    fireEvent.click(markers()[2]!)
    expect(pressed()).toHaveLength(0)
  })

  it('selecting a row selects its marker, symmetrically', () => {
    renderPanel()
    const row = screen.getByRole('button', {
      name: /Processing.*Glass furnace/,
    })
    fireEvent.click(row)
    expect(row).toHaveAttribute('aria-pressed', 'true')
    expect(pressed()).toHaveLength(2)
    expect(
      markers().filter((m) => m.getAttribute('aria-pressed') === 'true'),
    ).toHaveLength(1)
  })

  it('only one flow is ever selected', () => {
    renderPanel()
    fireEvent.click(markers()[2]!)
    fireEvent.click(markers()[7]!)
    expect(pressed()).toHaveLength(2)
    expect(markers()[2]).toHaveAttribute('aria-pressed', 'false')
    expect(markers()[7]).toHaveAttribute('aria-pressed', 'true')
  })

  it('does not scroll the page', () => {
    renderPanel()
    fireEvent.click(markers()[9]!)
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('clears the selection when a flow is removed', () => {
    renderPanel()
    fireEvent.click(markers()[2]!)
    expect(pressed()).toHaveLength(2)
    act(() => {
      dispatch({
        type: 'removeFlow',
        payload: { productId: 'product_a', stageIndex: 0, flowIndex: 3 },
      })
    })
    expect(pressed()).toHaveLength(0)
  })
})
