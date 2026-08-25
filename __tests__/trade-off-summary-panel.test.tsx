import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TradeOffSummaryPanel } from '@/src/components/compare'
import type {
  CategoryComparison,
  ComparisonSummary,
} from '@/src/domain/compare'
import type { ImpactCategory } from '@/src/domain/format'

const CATEGORY_ORDER: ImpactCategory[] = ['gwp', 'eutrophication', 'water']

function comparison(
  winners: Record<ImpactCategory, 'a' | 'b' | 'tie'>,
): CategoryComparison[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    unit: 'u',
    a: 1,
    b: 2,
    winner: winners[category],
    deltaPercent: 0,
    aBarPercent: 50,
    bBarPercent: 100,
  }))
}

function summaryPanel(
  overrides: Partial<ComparisonSummary> = {},
): ComparisonSummary {
  return {
    aWins: 1,
    bWins: 2,
    sentence:
      'No overall winner. Product A performs better on Eutrophication, Product B performs better on GWP and Water consumption.',
    ...overrides,
  }
}

function dots(row: HTMLElement): HTMLElement[] {
  return Array.from(row.querySelectorAll<HTMLElement>('[data-winner]'))
}

describe('TradeOffSummaryPanel', () => {
  it('renders a product header, one row per category, and a Total row', () => {
    const comparisons = comparison({
      gwp: 'b',
      eutrophication: 'a',
      water: 'b',
    })
    render(
      <TradeOffSummaryPanel
        summary={summaryPanel()}
        comparisons={comparisons}
        productAName="Product A"
        productBName="Product B"
      />,
    )

    expect(screen.getByText('Product A')).toBeInTheDocument()
    expect(screen.getByText('Product B')).toBeInTheDocument()
    expect(screen.getByText('GWP')).toBeInTheDocument()
    expect(screen.getByText('Eutrophication')).toBeInTheDocument()
    expect(screen.getByText('Water consumption')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('fills the winner dot per category and renders derived win counts', () => {
    const comparisons = comparison({
      gwp: 'b',
      eutrophication: 'a',
      water: 'b',
    })
    render(
      <TradeOffSummaryPanel
        summary={summaryPanel({ aWins: 1, bWins: 2 })}
        comparisons={comparisons}
        productAName="A"
        productBName="B"
      />,
    )

    const gwpRow = screen.getByText('GWP').closest('div')!
    const [gwpA, gwpB] = dots(gwpRow)
    expect(gwpA).toHaveAttribute('data-winner', 'false')
    expect(gwpB).toHaveAttribute('data-winner', 'true')

    const waterRow = screen.getByText('Water consumption').closest('div')!
    const [waterA, waterB] = dots(waterRow)
    expect(waterA).toHaveAttribute('data-winner', 'false')
    expect(waterB).toHaveAttribute('data-winner', 'true')

    const eutroRow = screen.getByText('Eutrophication').closest('div')!
    const [eutroA, eutroB] = dots(eutroRow)
    expect(eutroA).toHaveAttribute('data-winner', 'true')
    expect(eutroB).toHaveAttribute('data-winner', 'false')

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders the derived summary sentence and always-visible unweighted note', () => {
    const comparisons = comparison({
      gwp: 'b',
      eutrophication: 'a',
      water: 'b',
    })
    render(
      <TradeOffSummaryPanel
        summary={summaryPanel()}
        comparisons={comparisons}
        productAName="A"
        productBName="B"
      />,
    )

    expect(screen.getByText(/No overall winner/)).toBeInTheDocument()
    expect(
      screen.getByText('Categories are not weighted against each other.'),
    ).toBeInTheDocument()
  })

  it('renders a clean-sweep statement without "No overall winner" framing', () => {
    const clean = comparison({ gwp: 'a', eutrophication: 'a', water: 'a' })
    render(
      <TradeOffSummaryPanel
        summary={summaryPanel({
          aWins: 3,
          bWins: 0,
          sentence: 'Product A performs better on all three categories.',
        })}
        comparisons={clean}
        productAName="A"
        productBName="B"
      />,
    )

    expect(screen.queryByText(/No overall winner/)).not.toBeInTheDocument()
    expect(screen.getByText(/all three categories/)).toBeInTheDocument()
  })
})
