import { Tag } from '@/src/components/ui/tag'
import { formatScalingFactor } from '@/src/domain/format'
import styles from './product-summary-cards.module.css'

export interface ProductCardData {
  id: string
  name: string
  note: string | null
  functionalUnit: string
  scalingFactor: number
}

export interface ProductSummaryCardsProps {
  productA: ProductCardData
  productB: ProductCardData
  functionalUnit: string | null
  valid: boolean
}

function cardContent(product: ProductCardData) {
  const combined = [product.note, product.functionalUnit]
    .filter((part): part is string => Boolean(part))
    .join(' ')
  return combined || null
}

/**
 * Two white product cards side by side, each with a 2px left border (`--text`
 * for A, `--neutral` for B). Below them a full-width strip declares the common
 * functional unit. When the two products' functional units differ, comparison
 * is methodologically invalid: an `--error` line is rendered above the cards
 * and the card bodies are dimmed to 40% opacity.
 */
export function ProductSummaryCards({
  productA,
  productB,
  functionalUnit,
  valid,
}: ProductSummaryCardsProps) {
  const cards = [
    { data: productA, label: 'Product A', border: styles.borderA },
    { data: productB, label: 'Product B', border: styles.borderB },
  ]

  return (
    <section
      className={styles.wrap}
      aria-label="Product summary"
      data-valid={valid}
    >
      {!valid && (
        <p className={styles.error} role="alert">
          These two products have different functional units, so they cannot be
          compared. Normalising would be methodologically invalid.
        </p>
      )}

      <div className={styles.cards}>
        {cards.map(({ data, label, border }) => {
          const content = cardContent(data)
          return (
            <article
              key={data.id}
              className={`${styles.card} ${border}`}
            >
              <p className={styles.productLabel}>{label}</p>
              <h3 className={styles.name}>{data.name}</h3>
              {content && <p className={styles.line}>{content}</p>}
              <div className={styles.tags}>
                <Tag variant="scaling">
                  {formatScalingFactor(data.scalingFactor)}
                </Tag>
              </div>
            </article>
          )
        })}
      </div>

      <div className={styles.strip}>
        <GreenArrowsIcon />
        <span>
          Both normalised to:{' '}
          <strong>{functionalUnit ?? '—'}</strong>
        </span>
      </div>
    </section>
  )
}

function GreenArrowsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12h15" />
      <path d="m13 6 6 6-6 6" />
      <path d="M6 8 3 12l3 4" />
    </svg>
  )
}