// ─── Brand ────────────────────────────────────────────
export const colors = {
  brand: {
    DEFAULT: '#7C3AED',
    dark: '#5B21B6',
    light: '#EDE9FE',
  },

  // Public system surfaces
  public: {
    bg: '#FAFAF9',
    surface: '#FFFFFF',
    surfaceAlt: '#F5F3FF',
    border: '#E8E5E0',
    borderFocus: '#7C3AED',
    overlay: 'rgba(28,25,23,0.60)',
  },

  // Dashboard system surfaces
  dashboard: {
    bg: '#0F0F0F',
    surface: '#1A1A1A',
    surfaceAlt: '#242424',
    surfaceHover: '#2E2E2E',
    border: '#2E2E2E',
    borderLight: '#3D3D3D',
    borderFocus: '#7C3AED',
  },

  // Text — public
  textPublic: {
    primary: '#1C1917',
    secondary: '#78716C',
    muted: '#A8A29E',
    onBrand: '#FFFFFF',
  },

  // Text — dashboard
  textDashboard: {
    primary: '#F5F5F4',
    secondary: '#A8A29E',
    muted: '#78716C',
    onBrand: '#FFFFFF',
  },

  // Semantic
  success: { DEFAULT: '#10B981', bg: '#D1FAE5' },

  // Energy — FOMO triggers, public site + mobile only
  // Use for: Trending, Tonight, Selling Fast badges
  energy: { DEFAULT: '#F59E0B', bg: '#FEF3C7' },

  // Financial — revenue/earnings, dashboards only
  // Use for: revenue totals, payout amounts, GMV figures
  financial: { DEFAULT: '#D97706', bg: '#FEF0C7' },

  // Warning — admin/dashboard only, never on public site
  warning: { DEFAULT: '#F59E0B', bg: '#FEF3C7' },

  error: { DEFAULT: '#EF4444', bg: '#FEE2E2' },
  info: { DEFAULT: '#3B82F6', bg: '#DBEAFE' },

  // Gradients (as string values for CSS usage)
  gradients: {
    hero: 'linear-gradient(135deg, #7C3AED, #C026D3)',
    cardOverlay: 'linear-gradient(to top, rgba(28,25,23,0.85) 0%, transparent 60%)',
    // fire gradient removed in v2.0 — see design.md v2.0 changelog
  },

  // Chart data series
  chart: ['#7C3AED', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'],

  // Badge token map — explicit colour assignments per badge type
  badges: {
    upcoming:    { bg: '#FEF3C7', text: '#92400E' },
    live:        { bg: '#D1FAE5', text: '#065F46' },
    ended:       { bg: '#F5F5F4', text: '#78716C' },
    soldOut:     { bg: '#FEE2E2', text: '#991B1B' },
    draft:       { bg: '#F5F3FF', text: '#5B21B6' },
    trending:    { bg: '#FEF3C7', text: '#92400E' },
    tonight:     { bg: '#FEF3C7', text: '#92400E' },
    sellingFast: { bg: '#FEF2C7', text: '#92400E' },
    verified:    { bg: '#7C3AED', text: '#FFFFFF' },
    pending:     { bg: '#FEF3C7', text: '#92400E' },
    rejected:    { bg: '#FEE2E2', text: '#991B1B' },
    approved:    { bg: '#D1FAE5', text: '#065F46' },
  },

  // Mobile dark theme (Dice.fm-inspired) — React Native only
  mobile: {
    bg:             '#0D0D0D',
    surface:        '#1A1A1A',
    surfaceRaised:  '#252525',
    border:         'rgba(255,255,255,0.08)',
    borderFocus:    '#7C3AED',
    textPrimary:    '#FFFFFF',
    textSecondary:  '#A8A29E',
    textMuted:      '#555555',
    textOnBrand:    '#FFFFFF',
    btnPrimaryBg:   '#FFFFFF',
    btnPrimaryText: '#0D0D0D',
    btnBrandBg:     '#7C3AED',
    btnGhostBorder: 'rgba(255,255,255,0.25)',
    success:        '#10B981',
    error:          '#EF4444',
    energy:         '#F59E0B',
  },
} as const

// ─── Spacing (4pt grid) ───────────────────────────────
export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const

// ─── Layout containers ────────────────────────────────
export const containers = {
  narrow: '480px',
  standard: '768px',
  wide: '1280px',
  full: '100%',
} as const

// ─── Border radius (v2.0 — drastically tightened) ─────
export const radius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '10px',
  '2xl': '10px', // merged with xl in v2.0 — see design.md changelog
  full: '9999px',
} as const

// Shadows removed in v2.0. Depth is now communicated via border + surface-colour
// contrast only — see "Elevation via Border + Contrast" in design.md v2.0.
// Do not reintroduce a `shadows` export; use `colors.public`/`colors.dashboard`
// surface/border tokens instead.

// ─── Motion ───────────────────────────────────────────
export const motion = {
  duration: {
    micro: '100ms',
    fast: '200ms',
    default: '250ms',
    entrance: '300ms',
  },
  easing: {
    entrance: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
    exit: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
  },
} as const

// ─── Typography ───────────────────────────────────────
export const typography = {
  fontFamily: {
    sans: ['Inter Variable', 'Inter', 'sans-serif'],
    display: ['Anybody Variable', 'Anybody', 'sans-serif'], // NEW: Bold headers
    label: ['Space Grotesk', 'Space Mono', 'sans-serif'],   // NEW: Labels + buttons
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs:    { size: '12px', lineHeight: '16px',  weight: 400 },
    sm:    { size: '14px', lineHeight: '20px',  weight: 400 },
    base:  { size: '16px', lineHeight: '24px',  weight: 400 },
    lg:    { size: '18px', lineHeight: '28px',  weight: 500 },
    xl:    { size: '20px', lineHeight: '28px',  weight: 600 },
    '2xl': { size: '24px', lineHeight: '32px',  weight: 600 },
    '3xl': { size: '30px', lineHeight: '36px',  weight: 700 },
    '4xl': { size: '36px', lineHeight: '40px',  weight: 700 },
    '5xl': { size: '48px', lineHeight: '52px',  weight: 800 },
  },
  weight: {
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
    black:     900, // NEW: For Anybody headers
  },
} as const

// ─── Navigation dimensions ────────────────────────────
export const layout = {
  navHeight:        '64px',
  sidebarWidth:     '240px',
  sidebarCollapsed: '64px',
  tabBarHeight:     '80px',
  mobileNavHeight:  '56px',
} as const
