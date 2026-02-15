/**
 * Prythia design tokens.
 *
 * These are also defined as CSS variables in globals.css and Tailwind config.
 * This file provides typed JS access for components that need programmatic color values
 * (e.g., Recharts, dynamic styling).
 */

export const colors = {
  // Core palette
  bg: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  accent: '#e94560',
  ai: '#8b5cf6',
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#94a3b8',

  // Text
  textPrimary: '#f1f5f9',
  textMuted: '#64748b',

  // Backgrounds
  navy: '#1a1a2e',
  card: '#1e293b',
  surfaceHover: '#263040',
} as const

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const

export const typography = {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  monoFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
} as const

// Chart-specific tokens
export const chartColors = {
  line: colors.ai,
  area: `${colors.ai}20`, // 12% opacity
  volume: colors.border,
  grid: '#1e293b',
  tooltip: colors.surface,
  positive: colors.positive,
  negative: colors.negative,
} as const
