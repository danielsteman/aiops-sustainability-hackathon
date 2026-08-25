export type ImpactCategory = 'gwp' | 'eutrophication' | 'water'
export type FormatContext = 'grid' | 'normalised'

export const IMPACT_UNITS: Record<ImpactCategory, string> = {
  gwp: 'kg CO₂e',
  eutrophication: 'kg PO₄e',
  water: 'L',
}

export const IMPACT_PRECISION: Record<
  ImpactCategory,
  Record<FormatContext, number>
> = {
  gwp: { grid: 2, normalised: 2 },
  eutrophication: { grid: 7, normalised: 6 },
  water: { grid: 1, normalised: 1 },
}

export interface FormattedImpact {
  value: string
  truncated: boolean
}

function fixed(value: number, decimals: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatImpact(
  value: number,
  category: ImpactCategory,
  context: FormatContext,
): FormattedImpact {
  let decimals = IMPACT_PRECISION[category][context]
  let out = fixed(value, decimals)
  if (value !== 0 && !/[1-9]/.test(out)) {
    while (!/[1-9]/.test(out)) {
      decimals += 1
      out = fixed(value, decimals)
    }
    return { value: out, truncated: false }
  }
  return { value: out, truncated: true }
}

export function formatScalingFactor(n: number): string {
  return `×${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
