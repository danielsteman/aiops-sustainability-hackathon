export const colors = {
  bg: '#fafaf9',
  surface: '#ffffff',
  text: '#1c1917',
  'text-muted': '#78716c',
  primary: '#16a34a',
  'stage-extraction': '#dc2626',
  'stage-processing': '#2563eb',
  'stage-manufacturing': '#d97706',
  'stage-transport': '#7c3aed',
} as const

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

export const tokens = { colors, fontSize, fontWeight, fontFamily, lineHeight }

export type Token =
  keyof typeof colors | keyof typeof fontSize | keyof typeof fontWeight
