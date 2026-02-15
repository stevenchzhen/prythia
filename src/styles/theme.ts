/**
 * Prythia "Precision Futurism" design tokens.
 *
 * Matched to prythia.com marketing site:
 * - Dark obsidian base (#050506)
 * - Amber/gold accent (#f7d74c)
 * - Space Grotesk + JetBrains Mono
 * - Glass surfaces with backdrop blur
 * - Dot grid background pattern
 *
 * Use this file for Recharts and dynamic inline styles.
 * CSS variables are in globals.css.
 */

export const colors = {
  // Obsidian base
  bg: '#050506',
  surface: '#0e0f14',
  surfaceMuted: '#161823',
  stroke: '#2a2d3b',

  // Primary accent (amber/gold)
  primary: '#f7d74c',
  primaryStrong: '#ffd84a',
  primaryGhost: 'rgba(247, 215, 76, 0.04)',
  primarySubtle: 'rgba(247, 215, 76, 0.08)',
  primaryBorder: 'rgba(247, 215, 76, 0.12)',
  primaryMuted: 'rgba(247, 215, 76, 0.20)',
  primaryMid: 'rgba(247, 215, 76, 0.50)',
  primaryText: 'rgba(247, 215, 76, 0.85)',

  // Signal colors
  positive: '#22c55e',
  negative: '#ef4444',

  // Text
  foreground: '#f8f7f2',
  textMuted: '#71717a', // zinc-500
  textDim: '#52525b', // zinc-600

  // Glass
  glassBg: 'rgba(12, 13, 20, 0.72)',
  glassBorder: 'rgba(247, 215, 76, 0.14)',
  glassCard: 'rgba(12, 13, 20, 0.85)',
  glassNested: 'rgba(6, 7, 10, 0.75)',
} as const

export const typography = {
  fontFamily: '"Space Grotesk", system-ui, sans-serif',
  monoFamily: '"JetBrains Mono", monospace',
} as const

// Recharts tokens
export const chartColors = {
  line: colors.primary,
  area: colors.primaryGhost,
  volume: colors.primarySubtle,
  grid: colors.primaryGhost,
  tooltip: colors.surface,
  tooltipBorder: colors.glassBorder,
  positive: colors.positive,
  negative: colors.negative,
  axis: colors.stroke,
} as const
