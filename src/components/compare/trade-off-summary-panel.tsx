import type {
  CategoryComparison,
  ComparisonSummary,
} from '@/src/domain/compare'
import type { ImpactCategory } from '@/src/domain/format'
import styles from './trade-off-summary-panel.module.css'

const CATEGORY_LABEL: Record<ImpactCategory, string> = {
  gwp: 'GWP',
  eutrophication: 'Eutrophication',
  water: 'Water consumption',
}

export interface TradeOffSummaryPanelProps {
  summary: ComparisonSummary
  comparisons: CategoryComparison[]
  productAName: string
  productBName: string
}

/**
 * White card with a hard shadow laid out as a `420px 1fr` grid. Left is a dot
 * matrix: a header row of product names, one row per category with a 14px dot
 * per product (filled green for the category winner, outlined otherwise), a
 * divider, then a Total row with the derived win counts. Right is the derived
 * summary sentence and an always-visible note that categories are not weighted.
 */
export function TradeOffSummaryPanel({
  summary,
  comparisons,
  productAName,
  productBName,
}: TradeOffSummaryPanelProps) {
  return (
    <section className={styles.panel} aria-label="Trade-off summary">
      <div className={styles.matrix}>
        <div className={styles.header}>
          <span className={styles.headerCorner} />
          <span className={styles.productName}>{productAName}</span>
          <span className={styles.productName}>{productBName}</span>
        </div>

        {comparisons.map((entry) => (
          <div className={styles.row} key={entry.category}>
            <span className={styles.categoryLabel}>
              {CATEGORY_LABEL[entry.category]}
            </span>
            <span className={styles.dot} data-winner={entry.winner === 'a'} />
            <span className={styles.dot} data-winner={entry.winner === 'b'} />
          </div>
        ))}

        <div className={styles.divider} />

        <div className={styles.totalRow}>
          <span className={styles.categoryLabel}>Total</span>
          <span className={styles.totalCount}>{summary.aWins}</span>
          <span className={styles.totalCount}>{summary.bWins}</span>
        </div>
      </div>

      <div className={styles.summary}>
        <p className={styles.sentence}>{summary.sentence}</p>
        <p className={styles.note}>
          Categories are not weighted against each other.
        </p>
      </div>
    </section>
  )
}
