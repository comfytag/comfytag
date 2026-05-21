// Metro bundler prefers .native.ts on React Native.
// Web consumers continue using tokens/index.ts (CSS string values).
// This file provides numeric equivalents safe for RN StyleSheet.

export { colors } from './tokens/index'

// ─── Spacing (4pt grid, numeric px) ──────────────────
export const sp = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
} as const

// ─── Border radius (numeric px) ──────────────────────
export const rd = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  full: 9999,
} as const

// ─── Font sizes (numeric px) ─────────────────────────
export const fs = {
  xs:    12,
  sm:    14,
  base:  16,
  lg:    18,
  xl:    20,
  '2xl': 24,
} as const
