import type { ImpactCategory } from '@/src/domain/format'
import type { Factors } from '@/src/domain/impact'
import { STAGE_NAMES, type Product, type StageName } from '@/src/domain/types'
import type { StageShareResult } from '@/src/store/selectors'
import { colors } from '@/src/tokens'

/**
 * Every timeline measurement lives here rather than in the stylesheet: the
 * marker tiers, the leader lengths and the label boxes have to agree exactly,
 * and the overlap test asserts against these same numbers.
 */
export const TIMELINE_HEIGHT = 350
export const AXIS_TOP = 133
export const AXIS_HEIGHT = 14
export const STAGE_LABEL_TOP = 151
export const MARKER_SIZE = 14
export const MARKER_SELECTED_SIZE = 18
export const LABEL_WIDTH = 142
export const LABEL_HEIGHT = 34

/**
 * above-far, below-near, above-near, below-far. Markers cycle through these by
 * index so that four consecutive labels never share a horizontal band.
 *
 * The ceiling: four tiers separate four neighbours, so labels can still meet
 * where several flows crowd into one clamped 3% segment — product A on water,
 * for instance. Widening that needs more tiers or label culling, both of which
 * change the agreed layout.
 */
export const TIERS = [
  { above: true, leader: 96 },
  { above: false, leader: 44 },
  { above: true, leader: 44 },
  { above: false, leader: 96 },
] as const

export const STAGE_COLOR: Record<StageName, string> = {
  'Raw material extraction': colors['stage-extraction'],
  Processing: colors['stage-processing'],
  Manufacturing: colors['stage-manufacturing'],
  Transport: colors['stage-transport'],
}

export interface Segment {
  stage: StageName
  /** True share, for the label. */
  share: number
  /** Clamped share, for the drawn width. */
  width: number
  /** Cumulative offset of the segment's left edge, in percent. */
  left: number
  color: string
}

export interface Marker {
  /** Positional identity, shared with the flow list. */
  key: string
  stage: StageName
  stageIndex: number
  flowIndex: number
  description: string
  /** Normalised impact, per functional unit. */
  value: number
  /** Marker centre, in percent of the container width. */
  left: number
  tier: number
}

export interface TierGeometry {
  leaderTop: number
  leaderHeight: number
  labelTop: number
}

export function flowKey(stageIndex: number, flowIndex: number): string {
  return `${stageIndex}:${flowIndex}`
}

/**
 * Segments in canonical stage order regardless of the order the shares arrive
 * in, so the axis always reads extraction → processing → manufacturing →
 * transport.
 */
export function buildSegments(shares: StageShareResult[]): Segment[] {
  const byStage = new Map(shares.map((s) => [s.stage, s]))
  let left = 0
  return STAGE_NAMES.map((stage) => {
    const entry = byStage.get(stage)
    const segment: Segment = {
      stage,
      share: entry?.share ?? 0,
      width: entry?.width ?? 0,
      left,
      color: STAGE_COLOR[stage],
    }
    left += segment.width
    return segment
  })
}

export function buildMarkers(
  product: Product,
  factors: Factors,
  category: ImpactCategory,
  segments: Segment[],
): Marker[] {
  const scale = product.functional_unit_scaling_factor
  const markers: Marker[] = []
  for (const segment of segments) {
    const stageIndex = product.stages.findIndex((s) => s.name === segment.stage)
    const flows = product.stages[stageIndex]?.flows ?? []
    flows.forEach((flow, flowIndex) => {
      // A flow pointing at a missing factor contributes nothing rather than
      // taking the whole view down with it.
      const factor = factors[flow.material_id]?.[category] ?? 0
      markers.push({
        key: flowKey(stageIndex, flowIndex),
        stage: segment.stage,
        stageIndex,
        flowIndex,
        description: flow.description,
        value: flow.quantity * factor * scale,
        left:
          segment.left + (segment.width * (flowIndex + 1)) / (flows.length + 1),
        tier: markers.length % TIERS.length,
      })
    })
  }
  return markers
}

export function tierGeometry(tier: number): TierGeometry {
  const { above, leader } = TIERS[tier % TIERS.length]!
  if (above) {
    const leaderTop = AXIS_TOP - leader
    return {
      leaderTop,
      leaderHeight: leader,
      labelTop: leaderTop - LABEL_HEIGHT,
    }
  }
  const axisBottom = AXIS_TOP + AXIS_HEIGHT
  return {
    leaderTop: axisBottom,
    leaderHeight: leader,
    labelTop: axisBottom + leader,
  }
}

/**
 * Label left edge: centred on its marker, then held inside the container. CSS
 * `clamp` does the edge shift natively, so nothing has to measure the
 * container at runtime.
 */
export function labelLeftCss(leftPercent: number): string {
  return `clamp(0px, calc(${leftPercent}% - ${LABEL_WIDTH / 2}px), calc(100% - ${LABEL_WIDTH}px))`
}

/** Pixel mirror of {@link labelLeftCss}, for layout assertions. */
export function labelLeftPx(
  leftPercent: number,
  containerWidth: number,
): number {
  const centred = (leftPercent / 100) * containerWidth - LABEL_WIDTH / 2
  return Math.max(0, Math.min(centred, containerWidth - LABEL_WIDTH))
}
