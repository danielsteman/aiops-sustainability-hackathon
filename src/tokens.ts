export const colors = {
  bg: '#fafaf9',
  surface: '#ffffff',
  text: '#1c1917',
  'text-muted': '#78716c',
  neutral: '#57534e',
  primary: '#16a34a',
  'primary-hover': '#15803d',
  divider: '#e7e5e4',
  disabled: '#e7e5e4',
  error: '#dc2626',
  'bar-losing': '#c8c8c8',
  // Positional stage colours; a dataset names its own stages.
  'stage-1': '#dc2626',
  'stage-2': '#2563eb',
  'stage-3': '#d97706',
  'stage-4': '#7c3aed',
  'stage-5': '#0d9488',
  'stage-6': '#be185d',
} as const

/**
 * Stage colours are positional: a dataset names its own stages, and the count
 * varies per product, so nothing can map a colour to a fixed stage name.
 * Products with more stages than the palette wrap around.
 */
export const stagePalette = [
  colors['stage-1'],
  colors['stage-2'],
  colors['stage-3'],
  colors['stage-4'],
  colors['stage-5'],
  colors['stage-6'],
] as const

export function stageColor(index: number): string {
  return stagePalette[index % stagePalette.length]!
}

export const fontSize = {
  sm: '0.875rem',
  base: '1.0625rem',
  lg: '1.25rem',
  xl: '1.5rem',
} as const

export const fontWeight = {
  light: 300,
  semibold: 600,
  bold: 700,
} as const

export const fontFamily = {
  body: 'var(--font-source-sans-3), ui-sans-serif, system-ui, sans-serif',
} as const

export const lineHeight = {
  base: 1.4,
} as const

export const motion = {
  base: '150ms ease-in-out',
} as const

export const tokens = {
  colors,
  fontSize,
  fontWeight,
  fontFamily,
  lineHeight,
  motion,
}

export type Token =
  keyof typeof colors | keyof typeof fontSize | keyof typeof fontWeight
