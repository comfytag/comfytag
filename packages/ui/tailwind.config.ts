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
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
        xl: '0 16px 48px rgba(0,0,0,0.16)',
      },
      animation: {
        'pulse-slow': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'checkin-success': 'checkin 200ms ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
