import type { CSSProperties, ReactNode } from 'react'
import { stageColor } from '@/src/tokens'
import styles from './tag.module.css'
import { CheckIcon } from '@/src/components/icons/check'

interface TagProps {
  variant: 'region' | 'stage' | 'better' | 'scaling'
  region?: string | null
  /** Position of the stage in its product, which is what picks the colour. */
  stageIndex?: number
  children?: ReactNode
}

export function Tag({ variant, region, stageIndex, children }: TagProps) {
  const cls = [styles.tag, styles[variant]].filter(Boolean).join(' ')
  const style: CSSProperties =
    variant === 'stage' && stageIndex !== undefined
      ? { backgroundColor: stageColor(stageIndex) }
      : {}

  if (variant === 'region') {
    return (
      <span className={cls} data-variant="region">
        {region ?? '—'}
      </span>
    )
  }

  if (variant === 'stage') {
    return (
      <span className={cls} style={style} data-variant="stage">
        {children}
      </span>
    )
  }

  return (
    <span className={cls} data-variant={variant}>
      {variant === 'better' && <CheckIcon />}
      {children}
    </span>
  )
}
