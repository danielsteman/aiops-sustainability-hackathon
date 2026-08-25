'use client'

import { useEffect, useRef } from 'react'
import {
  formatImpact,
  IMPACT_UNITS,
  type ImpactCategory,
} from '@/src/domain/format'
import type { Marker } from './layout'
import styles from './timeline.module.css'

export interface FlowListProps {
  markers: Marker[]
  category: ImpactCategory
  selectedKey: string | null
  onSelect: (key: string) => void
}

/**
 * Scrolls a row into its own container without touching the page scroll
 * position — `scrollIntoView` cannot promise that, because it walks every
 * scrollable ancestor.
 */
export function scrollTop(
  container: { scrollTop: number; clientHeight: number },
  row: { offsetTop: number; offsetHeight: number },
): number {
  const bottom = row.offsetTop + row.offsetHeight
  if (row.offsetTop < container.scrollTop) return row.offsetTop
  if (bottom > container.scrollTop + container.clientHeight) {
    return bottom - container.clientHeight
  }
  return container.scrollTop
}

/**
 * Stand-in for the flow grid, carrying only what marker ↔ row selection needs:
 * one selectable row per flow in its own scroll container. LCA-029 replaces
 * this with the full eight-column grid.
 */
export function FlowList({
  markers,
  category,
  selectedKey,
  onSelect,
}: FlowListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const row = selectedRef.current
    if (!container || !row) return
    container.scrollTop = scrollTop(container, row)
  }, [selectedKey])

  const unit = IMPACT_UNITS[category]

  return (
    <div className={styles.flowList} ref={containerRef}>
      {markers.map((marker) => {
        const selected = selectedKey === marker.key
        return (
          <button
            key={marker.key}
            type="button"
            ref={selected ? selectedRef : undefined}
            className={styles.flowRow}
            data-selected={selected}
            aria-pressed={selected}
            onClick={() => onSelect(marker.key)}
          >
            <span className={styles.flowStage}>{marker.stage}</span>
            <span className={styles.flowDescription} title={marker.description}>
              {marker.description}
            </span>
            <span className={styles.flowValue}>
              {formatImpact(marker.value, category, 'normalised').value} {unit}
            </span>
          </button>
        )
      })}
    </div>
  )
}
