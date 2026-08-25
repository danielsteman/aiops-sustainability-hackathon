'use client'

import type { CSSProperties } from 'react'
import {
  formatImpact,
  IMPACT_UNITS,
  type ImpactCategory,
} from '@/src/domain/format'
import {
  AXIS_HEIGHT,
  AXIS_TOP,
  labelLeftCss,
  LABEL_WIDTH,
  STAGE_LABEL_TOP,
  tierGeometry,
  TIMELINE_HEIGHT,
  type Marker,
  type Segment,
} from './layout'
import styles from './timeline.module.css'

export interface LifecycleTimelineProps {
  segments: Segment[]
  markers: Marker[]
  category: ImpactCategory
  selectedKey: string | null
  onSelect: (key: string) => void
}

/**
 * The lifecycle axis: four stage segments sized by their share of the selected
 * category, one marker per flow sitting on the axis, and four alternating
 * label tiers above and below. All measurements come from `./layout` so the
 * stylesheet only carries appearance.
 */
export function LifecycleTimeline({
  segments,
  markers,
  category,
  selectedKey,
  onSelect,
}: LifecycleTimelineProps) {
  const unit = IMPACT_UNITS[category]

  return (
    <div
      className={styles.timeline}
      style={{ height: TIMELINE_HEIGHT }}
      role="group"
      aria-label={`Lifecycle contribution timeline, ${category}`}
    >
      <div
        className={styles.axis}
        style={{ top: AXIS_TOP, height: AXIS_HEIGHT }}
      >
        {segments.map((segment) => (
          <div
            key={segment.stage}
            className={styles.segment}
            style={{ width: `${segment.width}%`, background: segment.color }}
            data-stage={segment.stage}
          />
        ))}
      </div>

      <div className={styles.stageLabels} style={{ top: STAGE_LABEL_TOP }}>
        {segments.map((segment) => (
          <div
            key={segment.stage}
            className={styles.stageLabel}
            style={{ width: `${segment.width}%` }}
            title={`${segment.stage} ${segment.share.toFixed(1)}%`}
          >
            {segment.stage} {segment.share.toFixed(1)}%
          </div>
        ))}
      </div>

      {markers.map((marker) => {
        const { leaderTop, leaderHeight, labelTop } = tierGeometry(marker.tier)
        const selected = selectedKey === marker.key
        return (
          <div
            key={marker.key}
            className={styles.marker}
            data-tier={marker.tier}
            data-selected={selected}
            style={{ '--marker-left': `${marker.left}%` } as CSSProperties}
          >
            <span
              className={styles.leader}
              style={{ top: leaderTop, height: leaderHeight }}
            />
            <button
              type="button"
              className={styles.dot}
              style={{ top: AXIS_TOP }}
              title={marker.description}
              aria-pressed={selected}
              onClick={() => onSelect(marker.key)}
            >
              <span className={styles.srOnly}>{marker.description}</span>
            </button>
            <span
              className={styles.label}
              style={{
                top: labelTop,
                left: labelLeftCss(marker.left),
                width: LABEL_WIDTH,
              }}
            >
              <span className={styles.labelText}>{marker.description}</span>
              <span className={styles.labelValue}>
                {formatImpact(marker.value, category, 'normalised').value}{' '}
                {unit}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
