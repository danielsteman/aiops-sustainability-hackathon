import { Tag } from '@/src/components/ui/tag'
import type { CategoryComparison } from '@/src/domain/compare'
import { formatImpact } from '@/src/domain/format'
import styles from './category-block.module.css'

export interface CategoryBlockProps {
  comparison: CategoryComparison
  label: string
  description: string
}

interface Row {
  product: 'a' | 'b'
  label: string
  value: number
  barPercent: number
  isWinner: boolean
}

function deltaLabel(deltaPercent: number): string {
  return `Better here −${deltaPercent}%`
}

/**
 * One white card per impact category. Two paired bars scaled within the
 * category: the larger value renders at 100% width, the other relative to it.
 * The winning row shows a green "Better here" tag; the winning bar is outlined
 * in green on a transparent fill while the losing bar is solid neutral gray.
 * On a tie neither row shows a tag and the footer states equivalence.
 */
export function CategoryBlock({
  comparison,
  label,
  description,
}: CategoryBlockProps) {
  const { unit, a, b, winner, deltaPercent } = comparison
  const rows: Row[] = [
    {
      product: 'a',
      label: 'Product A',
      value: a,
      barPercent: comparison.aBarPercent,
      isWinner: winner === 'a',
    },
    {
      product: 'b',
      label: 'Product B',
      value: b,
      barPercent: comparison.bBarPercent,
      isWinner: winner === 'b',
    },
  ]
  const tie = winner === 'tie'

  return (
    <article className={styles.block} data-category={comparison.category}>
      <header className={styles.header}>
        <h3 className={styles.title}>
          {label} <span className={styles.unit}>{unit}</span>
        </h3>
        <p className={styles.description}>{description}</p>
      </header>

      <div className={styles.rows}>
        {rows.map((row) => (
          <div key={row.product} className={styles.row}>
            <span className={styles.productLabel}>{row.label}</span>
            <div className={styles.track}>
              <div
                className={
                  row.isWinner ? styles.barWinner : styles.barLoser
                }
                style={{ width: `${row.barPercent}%` }}
                data-zero={row.barPercent === 0}
                data-subpct={row.barPercent > 0 && row.barPercent < 1}
              />
            </div>
            <div className={styles.meta}>
              {!tie && row.isWinner && (
                <Tag variant="better">{deltaLabel(deltaPercent)}</Tag>
              )}
              <span className={styles.value}>
                {formatImpact(row.value, comparison.category, 'normalised')
                  .value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        {tie
          ? `The two products are equivalent in this category.`
          : `Product ${winnerLabel(winner)} is better here by ${deltaPercent}%. Bars are scaled per category.`}
      </footer>
    </article>
  )
}

function winnerLabel(winner: CategoryComparison['winner']): string {
  return winner === 'a' ? 'A' : 'B'
}