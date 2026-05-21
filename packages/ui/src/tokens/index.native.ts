// Metro bundler resolves this file for React Native instead of index.ts.
// Re-exports all CSS string tokens for any code that needs them,
// then adds numeric sp/rd/fs helpers safe for RN StyleSheet.

export * from './base'

// ─── Spacing (4pt grid, numeric) ─────────────────────────
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

// ─── Border radius (numeric) ─────────────────────────────
export const rd = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  full: 9999,
} as const

// ─── Font sizes (numeric) ────────────────────────────────
export const fs = {
  xs:    12,
  sm:    14,
  base:  16,
  lg:    18,
  xl:    20,
  '2xl': 24,
} as const
