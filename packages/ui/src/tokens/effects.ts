// ─── Glass Morphism Effects ───────────────────────────

export const glassMorphism = {
  // Light system: subtle blur with semi-transparent background
  card: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(124, 58, 237, 0.1)',
  },

  // Dashboard (dark) system: pronounced blur effect
  cardDark: {
    background: 'rgba(26, 26, 26, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },

  // Navbar/header with glass effect
  navDark: {
    background: 'rgba(15, 15, 15, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
} as const

// ─── Glow Effects ────────────────────────────────────

export const glow = {
  // Subtle brand glow
  subtle: {
    textShadow: '0 0 10px rgba(124, 58, 237, 0.3)',
  },

  // Medium brand glow (default for highlights)
  medium: {
    textShadow: '0 0 20px rgba(208, 188, 255, 0.5)',
  },

  // Strong fire glow (for CTAs and emphasis)
  strong: {
    textShadow: '0 0 30px rgba(255, 81, 106, 0.6)',
  },

  // Box glow (for card emphasis)
  boxSubtle: {
    boxShadow: '0 0 20px rgba(124, 58, 237, 0.2)',
  },

  boxMedium: {
    boxShadow: '0 0 30px rgba(124, 58, 237, 0.4)',
  },

  boxFire: {
    boxShadow: '0 0 40px rgba(255, 81, 106, 0.5)',
  },
} as const

// ─── Animation Keyframes ──────────────────────────────

export const keyframes = {
  // Glow pulse animation
  glowPulse: {
    '0%, 100%': {
      textShadow: '0 0 10px rgba(124, 58, 237, 0.3)',
    },
    '50%': {
      textShadow: '0 0 25px rgba(124, 58, 237, 0.6)',
    },
  },

  // Fire glow pulse (more intense)
  fireGlowPulse: {
    '0%, 100%': {
      textShadow: '0 0 15px rgba(255, 81, 106, 0.4)',
    },
    '50%': {
      textShadow: '0 0 35px rgba(255, 81, 106, 0.8)',
    },
  },

  // Box shadow glow pulse
  boxGlowPulse: {
    '0%, 100%': {
      boxShadow: '0 0 20px rgba(124, 58, 237, 0.2)',
    },
    '50%': {
      boxShadow: '0 0 40px rgba(124, 58, 237, 0.5)',
    },
  },

  // Shimmer effect for loading states
  shimmer: {
    '0%': {
      backgroundPosition: '-1000px 0',
    },
    '100%': {
      backgroundPosition: '1000px 0',
    },
  },

  // Float animation (subtle upward motion)
  float: {
    '0%, 100%': {
      transform: 'translateY(0px)',
    },
    '50%': {
      transform: 'translateY(-8px)',
    },
  },
} as const

// ─── Animation Durations (for Tailwind) ──────────────

export const animationDurations = {
  glowPulse: '2s',
  fireGlowPulse: '2.5s',
  boxGlowPulse: '2s',
  shimmer: '2s',
  float: '3s',
} as const

// ─── Box Shadow Extensions (for Tailwind) ──────────

export const shadowExtensions = {
  glow: '0 0 20px rgba(124, 58, 237, 0.3)',
  'glow-lg': '0 0 40px rgba(124, 58, 237, 0.5)',
  'glow-fire': '0 0 30px rgba(255, 81, 106, 0.5)',
  'glow-fire-lg': '0 0 50px rgba(255, 81, 106, 0.7)',
} as const
