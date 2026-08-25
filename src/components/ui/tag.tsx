import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/src/tokens'
import styles from './tag.module.css'
import { CheckIcon } from '@/src/components/icons/check'

export type Stage = 'extraction' | 'processing' | 'manufacturing' | 'transport'

interface TagProps {
  variant: 'region' | 'stage' | 'better' | 'scaling'
  region?: string | null
  stage?: Stage
  children?: ReactNode
}

const stageColor: Record<Stage, string> = {
  extraction: colors['stage-extraction'],
  processing: colors['stage-processing'],
  manufacturing: colors['stage-manufacturing'],
  transport: colors['stage-transport'],
}

export function Tag({ variant, region, stage, children }: TagProps) {
  const cls = [styles.tag, styles[variant]].filter(Boolean).join(' ')
  const style: CSSProperties =
    variant === 'stage' && stage ? { backgroundColor: stageColor[stage] } : {}

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
