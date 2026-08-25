import Link from 'next/link'
import styles from './empty-state.module.css'
import { Button } from '@/src/components/ui'

interface EmptyStateProps {
  heading: string
  line: string
  actionLabel?: string
  href?: string
  onAction?: () => void
}

export function EmptyState({
  heading,
  line,
  actionLabel,
  href,
  onAction,
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <h2 className={styles.heading}>{heading}</h2>
      <p className={styles.line}>{line}</p>
      {actionLabel &&
        (href ? (
          <Link href={href} className="inline-flex">
            <Button>{actionLabel}</Button>
          </Link>
        ) : onAction ? (
          <Button onClick={onAction} type="button">
            {actionLabel}
          </Button>
        ) : null)}
    </div>
  )
}
