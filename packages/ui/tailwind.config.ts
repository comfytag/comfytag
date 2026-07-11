import type { Config } from 'tailwindcss'

const config: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          dark: '#5B21B6',
          light: '#EDE9FE',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F5F3FF',
          dark: '#1A1A1A',
          'dark-alt': '#242424',
          'dark-hover': '#2E2E2E',
        },
        warm: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E8E5E0',
          300: '#A8A29E',
          400: '#78716C',
          900: '#1C1917',
        },
        // Semantic — context-specific (see design.md badge rules)
        energy: '#F59E0B',
        financial: '#D97706',
        warning: '#F59E0B',
        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'sans-serif'],
        display: ['Anybody Variable', 'Anybody', 'sans-serif'], // NEW: Bold headers
        label: ['Space Grotesk', 'Space Mono', 'sans-serif'],   // NEW: Labels
        mono: ['JetBrains Mono', 'monospace'],
      },
      // v2.0: radius drastically tightened, all boxShadow/glow utilities removed.
      // Depth comes from border + surface-colour contrast only — see design.md v2.0.
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '10px',
      },
      boxShadow: {
        none: 'none',
      },
      animation: {
        'pulse-slow': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'checkin-success': 'checkin 200ms ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 300ms cubic-bezier(0.0, 0.0, 0.2, 1.0)',
        'fade-out': 'fadeOut 200ms cubic-bezier(0.4, 0.0, 1.0, 1.0)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
