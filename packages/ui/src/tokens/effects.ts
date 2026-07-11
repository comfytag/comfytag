// Glass morphism, glow effects, and the fire gradient that used to live here were
// introduced undocumented by the "Afterdark Kinetic" effort (May–Jun 2026) and are
// removed as of design.md v2.0's calm/professional direction — see design.md's
// Version History for the full rationale. Do not reintroduce glassMorphism/glow/
// shadowExtensions/fire-gradient tokens; depth now comes from
// "Elevation via Border + Contrast" (colors.public/colors.dashboard surface +
// border tokens in ./base) and emphasis comes from typography weight only.

// ─── Animation Keyframes (non-glow only) ──────────────

export const keyframes = {
  // Shimmer effect for loading states — kept, not glow-related
  shimmer: {
    '0%': {
      backgroundPosition: '-1000px 0',
    },
    '100%': {
      backgroundPosition: '1000px 0',
    },
  },
} as const

export const animationDurations = {
  shimmer: '2s',
} as const
